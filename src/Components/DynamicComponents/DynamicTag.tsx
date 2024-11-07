import React from 'react';

interface DynamicTagProps {
  tag: string;
  text: string;
}

const DynamicTag: React.FC<DynamicTagProps> = ({ tag, text }) => {
  const Tag = tag as keyof JSX.IntrinsicElements;

  return <Tag>{text}</Tag>;
};

export default DynamicTag;
