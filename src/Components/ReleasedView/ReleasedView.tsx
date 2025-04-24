import React, { useState } from 'react';
import {
  JumpLinks,
  JumpLinksItem,
  Sidebar,
  SidebarContent,
  SidebarPanel,
  TextContent,
} from '@patternfly/react-core';

import './release-view.scss';

type ReleaseNote = {
  title: string;
  text: string;
  tag: 'small' | 'a' | 'blockquote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'pre' | undefined;
  relevant: boolean;
};

type DataProps = {
  data: ReleaseNote[];
};

export const Scrollspy: React.FC<DataProps> = ({ data }) => {
  const [activeLinkIndex, setActiveLinkIndex] = useState(0);

  return (
    <>
      <Sidebar hasGutter isPanelRight>
        <SidebarPanel variant="sticky">
          {data.length > 0 ? (
            <JumpLinks
              activeIndex={activeLinkIndex}
              isVertical={true}
              label="Jump to section"
              scrollableSelector="#scrollable-element"
              offset={0}
            >
              {data.map((v, i) => (
                <JumpLinksItem
                  key={i}
                  isActive={activeLinkIndex === i}
                  onClick={() => {
                    document.getElementById(`${v.title}-${i}`)?.focus();
                    window.history.pushState(null, '', `${window.location.pathname}#${v.title}-${i}`);
                    setActiveLinkIndex(i);
                  }}
                >
                  {v.title}
                </JumpLinksItem>
              ))}
            </JumpLinks>
          ) : null}
        </SidebarPanel>
        <SidebarContent hasNoBackground>
          <TextContent>
            {data.length > 0 ? (
              data.map((v, i) => (
                <div key={i} style={{ maxWidth: '800px', marginBottom: '32px' }}>
                  <h2 id={`${v.title}-${i}`} tabIndex={-1}>
                    {v.title}
                  </h2>
                  <p>{v.text}</p>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vel est pulvinar, ullamcorper
                    est sed, tempus nunc. Aliquam orci diam, malesuada sed turpis eu, ultrices iaculis mauris.
                    Etiam pretium maximus turpis, nec faucibus enim dictum at. Nulla finibus vehicula eros, ac
                    mollis est. Etiam diam urna, sollicitudin at sem sit amet, finibus euismod dolor. Sed consequat
                    cursus porttitor. Morbi sit amet eleifend diam. Nullam eget pharetra dolor. In pellentesque
                    convallis mi eu semper. Nullam ut vestibulum risus, ut cursus felis. Praesent at mauris vitae
                    lorem laoreet molestie. Fusce feugiat blandit est, non dictum diam condimentum vel.
                  </p>
                </div>
              ))
            ) : (
              <p>No data</p>
            )}
          </TextContent>
        </SidebarContent>
      </Sidebar>
    </>
  );
};

export default Scrollspy;
