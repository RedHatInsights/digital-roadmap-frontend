import './released.scss';
import React, { Suspense, lazy } from 'react';
import {
  Button,
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

import { getRelevantReleaseNotes } from '../../api';

const SelectOptionVariations = lazy(
  () => import('../FilterComponents/CustomDropdown')
);

type ReleaseNote = {
  title: string;
  text: string;
  tag:
    | 'small'
    | 'a'
    | 'blockquote'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'p'
    | 'pre'
    | undefined;
  relevant: boolean;
};

const ReleasedTab: React.FC<React.PropsWithChildren> = () => {
  const emptyReleaseNotes: ReleaseNote[] = [];
  const [relevantReleaseNotes, setRelevantReleaseNotes] =
    React.useState(emptyReleaseNotes);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchData = (major: number, minor: number, keyword: string) => {
    setIsLoading(true);
    getRelevantReleaseNotes(major, minor, keyword)
      .then((data) => {
        const releaseNoteParagraphs: ReleaseNote[] = data || [];
        setRelevantReleaseNotes(releaseNoteParagraphs);
        setIsLoading(false);
      })
      .catch(() => {
        // Dispatch notif here
        setIsLoading(false);
      });
  };

  const items = (
    <React.Fragment>
      <ToolbarItem style={{ alignSelf: 'center' }}>
        <TextContent>
          <Text component={TextVariants.h6}>Release</Text>
        </TextContent>
      </ToolbarItem>
      <ToolbarItem variant="bulk-select">
        <Suspense fallback={<Spinner />}>
          <SelectOptionVariations />
        </Suspense>
      </ToolbarItem>
      <ToolbarItem>
        <Button onClick={() => fetchData(9, 5, 'security')} variant="primary">
          GET 9.5 with security
        </Button>
      </ToolbarItem>
      <ToolbarItem>
        <Button
          onClick={() => fetchData(9, 6, 'virtualization')}
          variant="primary"
        >
          GET 9.6 with virtualization
        </Button>
      </ToolbarItem>
    </React.Fragment>
  );

  // useEffect(() => {
  //   fetchData();
  // }, []);

  return (
    <>
      <Toolbar id="toolbar-items-example">
        <ToolbarContent alignItems={'center'}>{items}</ToolbarContent>
      </Toolbar>
      <Sidebar isPanelRight hasBorder hasGutter>
        <SidebarPanel>
          <TextContent>
            <Text component={TextVariants.h6}>Jump to section</Text>
          </TextContent>
          <TextContent>
            <Text component={TextVariants.p}>
              TODO: List of headings to jump to
            </Text>
          </TextContent>
        </SidebarPanel>
        <SidebarContent>
          {isLoading ? (
            <Spinner />
          ) : relevantReleaseNotes.length > 0 ? (
            relevantReleaseNotes.map((note, index) => (
              <div
                key={index}
                className={note.relevant ? 'relevant' : 'non-relevant'}
                style={{ marginBottom: '0.5em' }}
              >
                <Text component={note.tag}>{note.title}</Text>
                <p>{note.text}</p>
              </div>
            ))
          ) : (
            <p>No release notes found</p>
          )}
        </SidebarContent>
      </Sidebar>
    </>
  );
};

export default ReleasedTab;
