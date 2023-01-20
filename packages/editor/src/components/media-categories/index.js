/**
 * The `editor` settings here need to be in sync with the corresponding ones in `editor` package.
 * See `packages/editor/src/components/media-categories/index.js`.
 *
 * In the future we could consider creating an Openvese package that can be used in both `editor` and `site-editor`.
 * The rest of the settings would still need to be in sync though.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as coreStore } from '@wordpress/core-data';

/** @typedef {import('@wordpress/block-editor').InserterMediaRequest} InserterMediaRequest */
/** @typedef {import('@wordpress/block-editor').InserterMediaItem} InserterMediaItem */
/**
 * Interface for inserter media category labels.
 *
 * @typedef {Object} InserterMediaCategoryLabels
 * @property {string} name                    General name of the media category. It's used in the inserter media items list.
 * @property {string} [search_items='Search'] Label for searching items. Default is ‘Search Posts’ / ‘Search Pages’.
 */
/**
 * Interface for inserter media category.
 *
 * @typedef {Object} InserterMediaCategory
 * @property {string}                                                 name                 The name of the media category, that should be unique among all media categories.
 * @property {InserterMediaCategoryLabels}                            labels               Labels for the media category.
 * @property {('image'|'audio'|'video')}                              mediaType            The media type of the media category.
 * @property {(InserterMediaRequest) => Promise<InserterMediaItem[]>} fetch                The function to fetch media items for the category.
 * @property {(InserterMediaItem) => string}                          [getReportUrl]       If the media category supports reporting media items, this function should return
 *                                                                                         the report url for the media item. It accepts the `InserterMediaItem` as an argument.
 * @property {boolean}                                                [isExternalResource] If the media category is an external resource, this should be set to true.
 *                                                                                         This is used to avoid making a request to the external resource when the user
 *                                                                                         opens the inserter for the first time.
 */

const getExternalLink = ( url, text ) =>
	`<a href="${ url }" target="_blank" rel="noreferrer noopener">${ text }</a>`;

const getOpenverseLicense = ( license, licenseVersion ) => {
	let licenseName = license.trim();
	// PDM has no abbreviation
	if ( license !== 'pdm' ) {
		licenseName = license.toUpperCase().replace( 'SAMPLING', 'Sampling' );
	}
	// If version is known, append version to the name.
	// The license has to have a version to be valid. Only
	// PDM (public domain mark) doesn't have a version.
	if ( licenseVersion ) {
		licenseName += ` ${ licenseVersion }`;
	}
	// For licenses other than public-domain marks, prepend 'CC' to the name.
	if ( ! [ 'pdm', 'cc0' ].includes( license ) ) {
		licenseName = `CC ${ licenseName }`;
	}
	return licenseName;
};

const getOpenverseCaption = ( item ) => {
	const {
		title,
		foreign_landing_url: foreignLandingUrl,
		creator,
		creator_url: creatorUrl,
		license,
		license_version: licenseVersion,
		license_url: licenseUrl,
	} = item;
	const fullLicense = getOpenverseLicense( license, licenseVersion );
	const _creator = decodeEntities( creator );
	const caption = title
		? sprintf(
				// translators: %1s: Title of a media work from Openverse; %2s: Name of the media's creator; %3s: Media works's licence e.g: "CC0 1.0".
				__( '"%1$s" by %2$s/ %3$s' ),
				getExternalLink( foreignLandingUrl, decodeEntities( title ) ),
				creatorUrl ? getExternalLink( creatorUrl, _creator ) : _creator,
				licenseUrl
					? getExternalLink(
							`${ licenseUrl }?ref=openverse`,
							fullLicense
					  )
					: fullLicense
		  )
		: sprintf(
				// translators: %1s: Default title for an untitled media work from Openverse; %2s: Name of the media's creator; %3s: Media item's licence e.g: "CC0 1.0".
				__( '"%1$s" by %2$s/ %3$s' ),
				getExternalLink( foreignLandingUrl, 'Work' ),
				creatorUrl ? getExternalLink( creatorUrl, _creator ) : _creator,
				licenseUrl
					? getExternalLink(
							`${ licenseUrl }?ref=openverse`,
							fullLicense
					  )
					: fullLicense
		  );
	return caption.replace( /\s{2}/g, ' ' );
};

const coreMediaFetch = async ( query = {} ) => {
	const mediaItems = await resolveSelect( coreStore ).getMediaItems( {
		...query,
		orderBy: !! query?.search ? 'relevance' : 'date',
	} );
	return mediaItems.map( ( mediaItem ) => ( {
		...mediaItem,
		alt: mediaItem.alt_text,
		url: mediaItem.source_url,
		previewUrl: mediaItem.media_details?.sizes?.medium?.source_url,
		caption: mediaItem.caption?.raw,
	} ) );
};

/** @type {InserterMediaCategory[]} */
const inserterMediaCategories = [
	{
		name: 'images',
		labels: {
			name: __( 'Images' ),
			search_items: __( 'Search images' ),
		},
		mediaType: 'image',
		async fetch( query = {} ) {
			return coreMediaFetch( { ...query, media_type: 'image' } );
		},
	},
	{
		name: 'videos',
		labels: {
			name: __( 'Videos' ),
			search_items: __( 'Search videos' ),
		},
		mediaType: 'video',
		async fetch( query = {} ) {
			return coreMediaFetch( { ...query, media_type: 'video' } );
		},
	},
	{
		name: 'audio',
		labels: {
			name: __( 'Audio' ),
			search_items: __( 'Search audio' ),
		},
		mediaType: 'audio',
		async fetch( query = {} ) {
			return coreMediaFetch( { ...query, media_type: 'audio' } );
		},
	},
	{
		name: 'openverse',
		labels: {
			name: __( 'Openverse' ),
			search_items: __( 'Search Openverse' ),
		},
		mediaType: 'image',
		async fetch( query = {} ) {
			const defaultArgs = {
				mature: false,
				excluded_source: 'flickr,inaturalist,wikimedia',
				license: 'pdm,cc0',
			};
			const finalQuery = { ...query, ...defaultArgs };
			const mapFromInserterMediaRequest = {
				per_page: 'page_size',
				search: 'q',
			};
			const url = new URL(
				'https://api.openverse.engineering/v1/images/'
			);
			Object.entries( finalQuery ).forEach( ( [ key, value ] ) => {
				const queryKey = mapFromInserterMediaRequest[ key ] || key;
				url.searchParams.set( queryKey, value );
			} );
			const response = await window.fetch( url, {
				headers: {
					'User-Agent': 'WordPress/inserter-media-fetch',
				},
			} );
			const jsonResponse = await response.json();
			const results = jsonResponse.results;
			return results.map( ( result ) => ( {
				...result,
				// This is a temp solution for better titles, until Openverse API
				// completes the cleaning up of some titles of their upstream data.
				title: result.title?.toLowerCase().startsWith( 'file:' )
					? result.title.slice( 5 )
					: result.title,
				sourceId: result.id,
				id: undefined,
				caption: getOpenverseCaption( result ),
				previewUrl: result.thumbnail,
			} ) );
		},
		getReportUrl: ( { sourceId } ) =>
			`https://wordpress.org/openverse/image/${ sourceId }/report/`,
		isExternalResource: true,
	},
];

export default inserterMediaCategories;
