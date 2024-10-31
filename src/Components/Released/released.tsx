import './released.scss';
import React, { Suspense, lazy } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarPanel,
  Spinner,
  Text,
  TextContent,
  TextVariants,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';

const ToggleGroupReleasedView = lazy(
  () => import('../FilterComponents/CustomToggleGroup')
);
const SelectOptionVariations = lazy(
  () => import('../FilterComponents/CustomDropdown')
);

const ReleasedTab: React.FC<React.PropsWithChildren> = () => {
  const items = (
    <React.Fragment>
      <ToolbarItem variant="search-filter">
        <Suspense fallback={<Spinner />}>
          <SelectOptionVariations />
        </Suspense>
      </ToolbarItem>
      <ToolbarItem style={{ alignSelf: 'center' }}>
        <TextContent>
          <Text component={TextVariants.h6}>View</Text>
        </TextContent>
      </ToolbarItem>
      <ToolbarItem>
        <Suspense fallback={<Spinner />}>
          <ToggleGroupReleasedView />
        </Suspense>
      </ToolbarItem>
    </React.Fragment>
  );
  return (
    <>
      <Toolbar id="toolbar-items-example">
        <ToolbarContent alignItems={'center'}>{items}</ToolbarContent>
      </Toolbar>
      <Sidebar hasBorder hasGutter>
        <SidebarPanel>Sidebar panel - TODO Sidebar component</SidebarPanel>
        <SidebarContent>
          <p>TODO table component</p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            dapibus nulla id augue dictum commodo. Donec mollis arcu massa,
            sollicitudin venenatis est rutrum vitae. Integer pulvinar ligula at
            augue mollis, ac pulvinar arcu semper. Maecenas nisi lorem,
            malesuada ac lectus nec, porta pretium neque. Ut convallis libero
            sit amet metus mattis, vel facilisis lorem malesuada. Duis
            consectetur ante sit amet magna efficitur, a interdum leo vulputate.
          </p>
          <p>
            Praesent at odio nec sapien ultrices tincidunt in non mauris. Orci
            varius natoque penatibus et magnis dis parturient montes, nascetur
            ridiculus mus. Duis consectetur nisl quis facilisis faucibus. Sed eu
            bibendum risus. Suspendisse porta euismod tortor, at elementum odio
            suscipit sed. Cras eget ultrices urna, ac feugiat lectus. Integer a
            pharetra velit, in imperdiet mi. Phasellus vel hendrerit velit.
            Vestibulum ut augue vitae erat vulputate bibendum a ut magna.
          </p>
        </SidebarContent>
      </Sidebar>
    </>
  );
};

export default ReleasedTab;
