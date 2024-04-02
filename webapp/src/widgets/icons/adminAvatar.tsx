// Copyright (c) 2024-present Midnight.Works and Sergiu Corjan. All Rights Reserved.

import React from 'react';
import './adminAvatar.scss';

// Props definition for component
interface SquadUserAvatarProps {
  imageUrl: string;
  altText?: string;
}

export default function SquadUserAvatar({ imageUrl, altText = 'User Avatar' }: SquadUserAvatarProps): JSX.Element {
  return (
    <div className="avatar-container">
      {imageUrl ? (
        <img src={imageUrl} alt={altText} className="user-avatar" />
      ) : (
        <div className="default-avatar"><img src="https://squad.midnight.works/assets/avatars/default_s.jpg" alt="default_avatar" className="user-avatar" /></div>
      )}
    </div>
  );
}