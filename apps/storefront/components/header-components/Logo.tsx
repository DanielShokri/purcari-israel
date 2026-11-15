import React from 'react';
import { Link } from 'react-router-dom';

const PURCARI_LOGO_URL = 'https://cdn.8wines.com/media/amasty/shopby/option_images/purcari-winery-logo.png';

const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex-shrink-0">
      <img 
        src={PURCARI_LOGO_URL}
        alt="Purcari - Château Purcari"
        width={91}
        height={52}
        className="h-13 w-auto"
      />
    </Link>
  );
};

export default Logo;
