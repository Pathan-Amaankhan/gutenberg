/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import TabPanel from '..';

jest.useFakeTimers();

const setupUser = () =>
	userEvent.setup( {
		advanceTimers: jest.advanceTimersByTime,
	} );

const TABS = [
	{
		name: 'alpha',
		title: 'Alpha',
		className: 'alpha-class',
	},
	{
		name: 'beta',
		title: 'Beta',
		className: 'beta-class',
	},
	{
		name: 'gamma',
		title: 'Gamma',
		className: 'gamma-class',
	},
];

const getSelectedTab = () => screen.getByRole( 'tab', { selected: true } );

let originalGetClientRects: () => DOMRectList;

describe( 'TabPanel', () => {
	beforeAll( () => {
		originalGetClientRects = window.HTMLElement.prototype.getClientRects;
		// Mocking `getClientRects()` is necessary to pass a check performed by
		// the `focus.tabbable.find()` and by the `focus.focusable.find()` functions
		// from the `@wordpress/dom` package.
		// @ts-expect-error We're not trying to comply to the DOM spec, only mocking
		window.HTMLElement.prototype.getClientRects = function () {
			return [ 'trick-jsdom-into-having-size-for-element-rect' ];
		};
	} );

	afterAll( () => {
		window.HTMLElement.prototype.getClientRects = originalGetClientRects;
	} );

	it( 'should render a tabpanel, and clicking should change tabs', async () => {
		const user = setupUser();
		const panelRenderFunction = jest.fn();
		const mockOnSelect = jest.fn();

		render(
			<TabPanel
				tabs={ TABS }
				children={ panelRenderFunction }
				onSelect={ mockOnSelect }
			/>
		);

		expect( getSelectedTab() ).toHaveTextContent( 'Alpha' );
		expect(
			screen.getByRole( 'tabpanel', { name: 'Alpha' } )
		).toBeInTheDocument();
		expect( panelRenderFunction ).toHaveBeenLastCalledWith( TABS[ 0 ] );
		expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

		await user.click( screen.getByRole( 'tab', { name: 'Beta' } ) );

		expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
		expect(
			screen.getByRole( 'tabpanel', { name: 'Beta' } )
		).toBeInTheDocument();
		expect( panelRenderFunction ).toHaveBeenLastCalledWith( TABS[ 1 ] );
		expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

		await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );

		expect( getSelectedTab() ).toHaveTextContent( 'Alpha' );
		expect(
			screen.getByRole( 'tabpanel', { name: 'Alpha' } )
		).toBeInTheDocument();
		expect( panelRenderFunction ).toHaveBeenLastCalledWith( TABS[ 0 ] );
		expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );
	} );

	describe( 'prop: initialTabName', () => {
		it( 'should render with a tab initially selected by prop initialTabName', () => {
			const mockOnSelect = jest.fn();
			render(
				<TabPanel
					initialTabName="beta"
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );
		} );

		it( 'should not render a different tab when initialTabName is changed', () => {
			const mockOnSelect = jest.fn();
			const { rerender } = render(
				<TabPanel
					initialTabName="beta"
					tabs={ TABS }
					children={ () => undefined }
				/>
			);

			rerender(
				<TabPanel
					initialTabName="alpha"
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( mockOnSelect ).not.toHaveBeenCalled();
		} );

		it( 'should fallback to initial tab if active tab is removed', async () => {
			const user = setupUser();
			const mockOnSelect = jest.fn();

			const { rerender } = render(
				<TabPanel
					tabs={ TABS }
					initialTabName="gamma"
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );

			rerender(
				<TabPanel
					tabs={ TABS.slice( 1 ) /* remove alpha */ }
					initialTabName="gamma"
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );
		} );

		it( 'should fallback to first enabled tab if active tab is removed', async () => {
			const user = setupUser();
			const mockOnSelect = jest.fn();

			const { rerender } = render(
				<TabPanel
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );

			rerender(
				<TabPanel
					tabs={ TABS.slice( 1 ) /* remove alpha */ }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );
		} );
	} );

	describe( 'prop: tabName', () => {
		it( 'should render with a tab selected by prop tabName', () => {
			const mockOnSelect = jest.fn();
			render(
				<TabPanel
					tabName="beta"
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( mockOnSelect ).toHaveBeenCalledWith( 'beta' );
		} );

		it( 'should override initialTabName when tabName is set', () => {
			const mockOnSelect = jest.fn();
			render(
				<TabPanel
					initialTabName="gamma"
					tabName="beta"
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( mockOnSelect ).toHaveBeenCalledWith( 'beta' );
		} );

		it( 'should re-render with a tab selected by prop tabName, when initialTabName not set', async () => {
			const mockOnSelect = jest.fn();
			const { rerender } = render(
				<TabPanel tabs={ TABS } children={ () => undefined } />
			);

			rerender(
				<TabPanel
					tabName="beta"
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( mockOnSelect ).toHaveBeenCalledWith( 'beta' );
		} );

		it( 'should re-render with a tab selected by prop tabName, when initialTabName is set', () => {
			const mockOnSelect = jest.fn();
			const { rerender } = render(
				<TabPanel
					initialTabName="beta"
					tabs={ TABS }
					children={ () => undefined }
				/>
			);

			rerender(
				<TabPanel
					tabName="gamma"
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect( mockOnSelect ).toHaveBeenCalledWith( 'gamma' );
		} );

		it( 'should fallback to first enabled tab, when active tab is removed', () => {
			const mockOnSelect = jest.fn();
			const { rerender } = render(
				<TabPanel
					tabName="beta"
					tabs={ TABS }
					children={ () => undefined }
				/>
			);

			rerender(
				<TabPanel
					tabs={ TABS.slice( 2 ) /* remove alpha, beta */ }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			expect( getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );
		} );

		it( 'should skip tab selection by tabName when it is disabled', () => {
			const mockOnSelect = jest.fn();
			const tabName = 'beta';
			const TABS_DISABLED = TABS.map( ( tab ) => ( {
				...tab,
				disabled: tab.name === tabName,
			} ) );

			render(
				<TabPanel
					tabName={ tabName }
					tabs={ TABS_DISABLED }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			expect( getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( mockOnSelect ).toHaveBeenCalledWith( 'alpha' );
		} );
	} );

	describe( 'Tabs', () => {
		it( "should apply the tab's `className` to the tab button", () => {
			render( <TabPanel tabs={ TABS } children={ () => undefined } /> );

			expect( screen.getByRole( 'tab', { name: 'Alpha' } ) ).toHaveClass(
				'alpha-class'
			);
			expect( screen.getByRole( 'tab', { name: 'Beta' } ) ).toHaveClass(
				'beta-class'
			);
			expect( screen.getByRole( 'tab', { name: 'Gamma' } ) ).toHaveClass(
				'gamma-class'
			);
		} );

		it( 'should apply the `activeClass` to the selected tab', async () => {
			const user = setupUser();
			const activeClass = 'my-active-tab';

			render(
				<TabPanel
					activeClass={ activeClass }
					tabs={ TABS }
					children={ () => undefined }
				/>
			);
			expect( getSelectedTab() ).toHaveClass( activeClass );
			screen
				.getAllByRole( 'tab', { selected: false } )
				.forEach( ( unselectedTab ) => {
					expect( unselectedTab ).not.toHaveClass( activeClass );
				} );

			await user.click( screen.getByRole( 'tab', { name: 'Beta' } ) );

			expect( getSelectedTab() ).toHaveClass( activeClass );
			screen
				.getAllByRole( 'tab', { selected: false } )
				.forEach( ( unselectedTab ) => {
					expect( unselectedTab ).not.toHaveClass( activeClass );
				} );
		} );
	} );

	describe( 'Disabled Tab', () => {
		it( 'should disable the tab when `disabled` is true', async () => {
			const user = setupUser();
			const mockOnSelect = jest.fn();

			render(
				<TabPanel
					tabs={ [
						...TABS,
						{
							name: 'delta',
							title: 'Delta',
							className: 'delta-class',
							disabled: true,
						},
					] }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			expect(
				screen.getByRole( 'tab', { name: 'Delta' } )
			).toHaveAttribute( 'aria-disabled', 'true' );

			// onSelect gets called on the initial render.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// onSelect should not be called since the disabled tab is highlighted, but not selected.
			await user.keyboard( '[ArrowLeft]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should select the first enabled tab when the inital tab is disabled', () => {
			const mockOnSelect = jest.fn();

			render(
				<TabPanel
					tabs={ [
						{
							name: 'alpha',
							title: 'Alpha',
							className: 'alpha-class',
							disabled: true,
						},
						{
							name: 'beta',
							title: 'Beta',
							className: 'beta-class',
						},
					] }
					initialTabName="alpha"
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
		} );

		it( 'should select the first enabled tab when the currently selected becomes disabled', () => {
			const mockOnSelect = jest.fn();

			const { rerender } = render(
				<TabPanel
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Alpha' );

			rerender(
				<TabPanel
					tabs={ TABS.map( ( tab ) => {
						if ( tab.name === 'alpha' ) {
							return { ...tab, disabled: true };
						}
						return tab;
					} ) }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
		} );
	} );

	describe( 'Tab Activation', () => {
		it( 'defaults to automatic tab activation', async () => {
			const user = setupUser();
			const mockOnSelect = jest.fn();

			render(
				<TabPanel
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			// onSelect gets called on the initial render.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Click on Alpha, make sure Alpha is selected
			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Navigate forward with arrow keys,
			// make sure Beta is selected automatically.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Navigate forward with arrow keys,
			// make sure Gamma (last tab) is selected automatically.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 4 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );

			// Navigate forward with arrow keys,
			// make sure Alpha (first tab) is selected automatically.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 5 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Navigate backwards with arrow keys,
			// make sure Gamma (last tab) is selected automatically
			await user.keyboard( '[ArrowLeft]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 6 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );
		} );

		it( 'switches to manual tab activation when the `selectOnMove` prop is set to `false`', async () => {
			const user = setupUser();
			const mockOnSelect = jest.fn();

			render(
				<TabPanel
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
					selectOnMove={ false }
				/>
			);

			// onSelect gets called on the initial render.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Click on Alpha, make sure Alpha is selected
			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Navigate forward with arrow keys.
			// Make sure Beta is focused, but that the tab selection happens only when
			// pressing the spacebar or the enter key.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( screen.getByRole( 'tab', { name: 'Beta' } ) ).toHaveFocus();
			await user.keyboard( '[Enter]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Navigate forward with arrow keys.
			// Make sure Gamma (last tab) is focused, but that the tab selection
			// happens only when pressing the spacebar or the enter key.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect(
				screen.getByRole( 'tab', { name: 'Gamma' } )
			).toHaveFocus();
			await user.keyboard( '[Space]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 4 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );

			// No need to test the "wrap-around" behavior, as it's being tested in the
			// "automatic tab activation" test above.
		} );
	} );
} );
