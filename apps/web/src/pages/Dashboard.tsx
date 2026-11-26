import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, ChevronRight, ArrowRight, Home,
  Shirt, ShoppingBag,
  TrendingUp, Zap, Flame, Truck, RotateCcw, Undo2,
  Headphones, Package
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import ProductCard from '@/components/ProductCard';

const categoryProductsUrl = (category: string) =>
  `/products?category=${encodeURIComponent(category)}`;

const BANNERS = [
  { title: 'Mega Electronics Sale', subtitle: 'Up to 75% off on laptops, smartwatches, headphones & more', gradient: 'from-blue-600 via-indigo-600 to-purple-700', cta: 'Shop Now', link: categoryProductsUrl('Electronics'), discount: 'Up to 75% OFF', showProducts: true, productsVariant: 'electronics', noDiscountPill: true },
  { title: 'Winter Fashion Sale', subtitle: 'New arrivals at unbeatable prices — styles for everyone.', gradient: 'from-rose-200 via-pink-200 to-rose-300', cta: 'Shop Now', link: categoryProductsUrl('Fashion'), discount: 'Up to 60% OFF', showProducts: true, productsVariant: 'fashion', noDiscountPill: true },
  { title: 'Home & Kitchen Fest', subtitle: 'Transform your space for less — curated essentials', gradient: 'from-emerald-500 via-teal-500 to-cyan-600', cta: 'Discover Now', link: categoryProductsUrl('Home & Kitchen'), discount: 'Up to 60% OFF', showProducts: true, productsVariant: 'homeKitchen', noDiscountPill: true },
];

type BannerConfig = (typeof BANNERS)[number];

function SnowflakeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 32 32)`}>
            <line x1="32" y1="32" x2="32" y2="6" />
            <polyline points="26.5,14.5 32,9.5 37.5,14.5" />
            <polyline points="25,22 32,16.5 39,22" />
          </g>
        ))}
      </g>
    </svg>
  );
}

function FashionTagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3.5 11.2V5.2C3.5 4.26 4.26 3.5 5.2 3.5H11.2C11.73 3.5 12.24 3.71 12.61 4.09L19.91 11.39C20.69 12.17 20.69 13.44 19.91 14.22L14.22 19.91C13.44 20.69 12.17 20.69 11.39 19.91L4.09 12.61C3.71 12.24 3.5 11.73 3.5 11.2Z"
        fill="#FBBF24"
        stroke="#D97706"
        strokeWidth="1.8"
      />
      <circle cx="8" cy="8" r="1.4" fill="#B45309" />
    </svg>
  );
}

function FlashDealsBanner() {
  const THUNDERBOLT_URL = '/banners/flash-thunderbolt.png';
  const LIMITED_OFFER_URL = '/banners/flash-limited-offer.png';
  const BAGS_URL = '/banners/flash-bags.png';

  return (
    <section
      className="relative rounded-[20px] border-[2.5px] border-white/95 overflow-hidden min-h-[104px] md:h-[120px] lg:h-[126px] flex items-center justify-between px-4 py-3.5 sm:px-5 md:px-6"
      style={{
        background:
          'linear-gradient(96deg, #FF6006 0%, #FA4416 20%, #EC1A3C 44%, #EA1256 66%, #E21B6D 86%, #D31B72 100%)',
        boxShadow:
          '0 10px 28px -4px rgba(236, 72, 153, 0.36), 0 4px 16px rgba(249, 115, 22, 0.28)',
      }}
    >
      {/* Top glossy glass sheen & warm radial stage glow behind shopping bags */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.03) 34%, transparent 62%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none hidden md:block"
        style={{
          background:
            'radial-gradient(ellipse 22% 95% at 68% 68%, rgba(255, 214, 98, 0.62) 0%, rgba(255, 130, 128, 0.26) 52%, transparent 82%)',
        }}
        aria-hidden="true"
      />

      {/* Sweeping golden-amber light swoosh & diagonal luminous rays */}
      <svg
        viewBox="0 0 1550 136"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="flash-swoosh-gold" x1="15%" y1="100%" x2="88%" y2="0%">
            <stop offset="0%" stopColor="#FF7A18" stopOpacity="0" />
            <stop offset="28%" stopColor="#FFA826" stopOpacity="0.55" />
            <stop offset="56%" stopColor="#FFE168" stopOpacity="0.88" />
            <stop offset="76%" stopColor="#FFF0B8" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FF88C6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="flash-ray-pink" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFE08C" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#FF9AD5" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="flash-glow-blur" x="-8%" y="-25%" width="116%" height="150%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>
        <path
          d="M280,136 C560,134 790,126 1020,86 C1140,65 1235,28 1340,-10 L1390,-10 C1270,40 1165,78 1030,104 C815,138 560,140 280,136 Z"
          fill="url(#flash-swoosh-gold)"
          filter="url(#flash-glow-blur)"
        />
        <path
          d="M360,136 C650,136 865,126 1045,92 C1140,74 1210,48 1280,15"
          fill="none"
          stroke="#FFF1A8"
          strokeWidth="2.5"
          opacity="0.72"
          filter="url(#flash-glow-blur)"
        />
        <polygon points="940,136 1225,-10 1315,-10 1055,136" fill="url(#flash-ray-pink)" />
        <polygon points="1030,136 1350,-10 1405,-10 1125,136" fill="url(#flash-ray-pink)" opacity="0.65" />
      </svg>

      {/* Left: 3D glossy flame box + Flash Deals + Thunderbolt + Sparkle + Subtitle */}
      <div className="relative z-10 flex items-center gap-3 sm:gap-4 min-w-0">
        <div
          className="h-12 w-12 md:h-[60px] md:w-[60px] rounded-[16px] shrink-0 flex items-center justify-center border border-white/35"
          style={{
            background: 'linear-gradient(165deg, #FF9240 0%, #FF5814 48%, #DE2A04 100%)',
            boxShadow:
              '0 8px 18px rgba(130, 18, 0, 0.42), inset 0 2px 2px rgba(255, 255, 255, 0.55), inset 0 -3px 4px rgba(175, 25, 0, 0.45)',
          }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 md:w-8 md:h-8 drop-shadow-[0_2px_4px_rgba(140,20,0,0.35)]" fill="none">
            <path
              d="M12.3 2.1C12.3 2.1 18.6 6.8 18.6 13.1C18.6 17.5 15.6 21.0 12.0 21.0C8.4 21.0 5.4 17.8 5.4 13.7C5.4 10.6 7.2 8.0 8.5 6.8C8.4 8.2 9.1 9.4 10.0 9.9C9.6 7.4 10.7 4.4 12.3 2.1Z"
              fill="#FFFFFF"
            />
            <path
              d="M12.1 12.2C12.1 12.2 14.4 14.3 14.4 16.5C14.4 18.0 13.3 19.1 12.0 19.1C10.7 19.1 9.6 18.0 9.6 16.5C9.6 14.6 10.9 13.2 12.1 12.2Z"
              fill="#FF5814"
            />
          </svg>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h3 className="text-xl sm:text-2xl md:text-[26px] lg:text-[28px] font-black italic text-white tracking-[-0.02em] leading-none drop-shadow-[0_2px_6px_rgba(120,10,0,0.35)] whitespace-nowrap">
              Flash Deals
            </h3>
            <img
              src={THUNDERBOLT_URL}
              alt=""
              className="h-6 sm:h-7 md:h-[31px] w-auto object-contain shrink-0 pointer-events-none"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(170, 35, 0, 0.45))' }}
              draggable={false}
              aria-hidden="true"
            />
            <svg
              viewBox="0 0 36 28"
              className="hidden sm:block h-5 w-6 text-[#FFE548] shrink-0 pointer-events-none"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M16 14 C19 9, 25 10, 22 16 C20 20, 15 17, 18 12 C21 7, 28 7, 32 11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path d="M8 5 L9.3 8.2 L12.5 9.5 L9.3 10.8 L8 14 L6.7 10.8 L3.5 9.5 L6.7 8.2 Z" fill="currentColor" />
              <circle cx="29" cy="20" r="1.4" fill="currentColor" />
            </svg>
          </div>
          <p className="mt-1 text-white/95 text-[11px] sm:text-[13.5px] md:text-[14.5px] font-medium leading-snug drop-shadow-[0_1px_2px_rgba(120,10,0,0.28)] sm:whitespace-nowrap">
            Get up to <span className="font-extrabold text-[#FFE538]">50% off</span> on all products!
          </p>
        </div>
      </div>

      {/* Center: Glossy Limited Time Offer 3D stopwatch pill */}
      <div
        className="hidden lg:flex items-center justify-center absolute left-[34.6%] top-1/2 -translate-y-1/2 w-[23.8%] h-[76%] z-10 pointer-events-none"
        style={{ filter: 'drop-shadow(0 6px 12px rgba(110, 8, 22, 0.36))' }}
        aria-hidden="true"
      >
        <img
          src={LIMITED_OFFER_URL}
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>

      {/* Right-center: Glossy 3D Shopping Bags with red % tag */}
      <div
        className="hidden md:block absolute left-[61.2%] bottom-[1%] w-[15.2%] h-[96%] z-10 pointer-events-none"
        style={{ filter: 'drop-shadow(0 6px 14px rgba(120, 8, 42, 0.32))' }}
        aria-hidden="true"
      >
        <img
          src={BAGS_URL}
          alt=""
          className="w-full h-full object-contain object-bottom"
          draggable={false}
        />
      </div>

      {/* Right: Shop Now white pill button */}
      <Link to="/products" className="relative z-10 shrink-0 ml-2 sm:ml-3">
        <Button className="group rounded-full bg-white hover:bg-[#FFF6F6] text-[#D11D22] font-bold px-3.5 py-2 sm:px-5 sm:py-2.5 md:px-7 md:py-3 h-auto text-xs sm:text-sm md:text-[15.5px] shadow-[0_8px_22px_rgba(130,8,35,0.28),0_0_16px_rgba(255,255,255,0.35)] cursor-pointer">
          Shop Now{' '}
          <ArrowRight size={15} strokeWidth={2.5} className="ml-1 sm:ml-1.5 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </section>
  );
}

function NeonArchRing({
  className,
  gradientId,
  filterId,
  stops,
  glowColor,
}: {
  className: string;
  gradientId: string;
  filterId: string;
  stops: Array<{ offset: string; color: string; opacity: number }>;
  glowColor: string;
}) {
  return (
    <div className={`absolute aspect-square pointer-events-none ${className}`}>
      <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="12%" y1="5%" x2="92%" y2="85%">
            {stops.map((s) => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
            ))}
          </linearGradient>
          <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>
        <circle
          cx="200"
          cy="200"
          r="194"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="14"
          opacity="0.55"
          filter={`url(#${filterId})`}
        />
        <circle
          cx="200"
          cy="200"
          r="194"
          fill="none"
          stroke={glowColor}
          strokeWidth="5"
          opacity="0.6"
          filter={`url(#${filterId})`}
        />
        <circle
          cx="200"
          cy="200"
          r="194"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.8"
        />
      </svg>
    </div>
  );
}

function BannerBenefitPills({
  discountLabel,
  pillClassName,
  percentColorClass = 'text-[#FACC15]',
}: {
  discountLabel: string;
  pillClassName: string;
  percentColorClass?: string;
}) {
  const shared = `inline-flex items-center gap-2 rounded-full backdrop-blur-md border border-white/25 px-3 lg:px-3.5 py-1.5 text-[11px] lg:text-[12.5px] font-medium text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] ${pillClassName}`;
  return (
    <div className="mt-3 sm:mt-4 lg:mt-5 hidden sm:flex flex-wrap items-center gap-2 lg:gap-2.5">
      <span className={shared}>
        <span className={`${percentColorClass} font-black text-xs lg:text-sm leading-none italic`}>%</span>
        {discountLabel}
      </span>
      <span className={shared}>
        <Truck size={14} className="text-white/90 shrink-0" />
        Free Shipping
      </span>
      <span className={shared}>
        <Undo2 size={14} className="text-white/90 shrink-0" />
        Easy Returns
      </span>
    </div>
  );
}

function BannerDiscountBadge({
  percent,
  positionClassName,
  cardClassName,
  percentColorClass,
}: {
  percent: string;
  positionClassName: string;
  cardClassName: string;
  percentColorClass: string;
}) {
  return (
    <div className={`absolute z-[9] ${positionClassName}`}>
      <div className={`backdrop-blur-md rounded-[20px] lg:rounded-[24px] px-4 lg:px-5 py-3 lg:py-4 border border-white/80 flex flex-col items-center min-w-[88px] lg:min-w-[112px] ${cardClassName}`}>
        <span className="text-[#152033] text-[10px] lg:text-xs font-semibold tracking-wide">
          Up to
        </span>
        <span className={`${percentColorClass} text-2xl lg:text-[36px] font-black leading-none mt-0.5 tracking-tight`}>
          {percent}
        </span>
        <span className="text-[#152033] text-[10px] lg:text-xs font-extrabold tracking-wide mt-1">
          OFF
        </span>
      </div>
    </div>
  );
}

function CylinderPedestal({
  className,
  ellipseHeight,
  topGradient = 'linear-gradient(135deg, #FFFFFF 0%, #F2F0FF 46%, #DBD4FF 78%, #BEA9FF 100%)',
  bodyGradient = 'linear-gradient(90deg, #8B9DFC 0%, #CFD6FF 16%, #9499F6 34%, #574CD8 56%, #4637BD 75%, #754AF5 90%, #A368FF 100%)',
  topShadow = 'inset 0 1px 2px rgba(255,255,255,0.95), inset 0 -1px 3px rgba(120,90,230,0.35), 0 0 14px rgba(190,180,255,0.26)',
  rimGradient,
  roundedBottom = false,
  bodyOverlayGradient = 'linear-gradient(to bottom, rgba(16,24,60,0.12) 0%, transparent 24%, rgba(10,16,45,0.20) 100%)',
}: {
  className: string;
  ellipseHeight: string;
  topGradient?: string;
  bodyGradient?: string;
  topShadow?: string;
  rimGradient?: string;
  roundedBottom?: boolean;
  bodyOverlayGradient?: string;
}) {
  const maskStyle = roundedBottom
    ? undefined
    : 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 64%, rgba(0,0,0,0) 100%)';

  return (
    <div className={`absolute pointer-events-none ${className}`}>
      {/* Vertical cylinder body starting at the top ellipse centerline */}
      <div
        className="absolute inset-x-0 bottom-0 z-[1]"
        style={{
          top: `calc(${ellipseHeight} / 2)`,
          background: bodyGradient,
          borderBottomLeftRadius: roundedBottom ? '50% 22%' : undefined,
          borderBottomRightRadius: roundedBottom ? '50% 22%' : undefined,
          WebkitMaskImage: maskStyle,
          maskImage: maskStyle,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: bodyOverlayGradient,
            borderBottomLeftRadius: roundedBottom ? '50% 22%' : undefined,
            borderBottomRightRadius: roundedBottom ? '50% 22%' : undefined,
          }}
        />
      </div>
      {/* Elliptical top surface (with optional metallic rim border) */}
      <div
        className="absolute top-0 inset-x-0 rounded-[50%] z-[2]"
        style={{
          height: ellipseHeight,
          background: rimGradient ?? topGradient,
          padding: rimGradient ? '2.2px' : undefined,
          boxShadow: rimGradient
            ? '0 2px 6px rgba(135, 75, 45, 0.14)'
            : topShadow,
        }}
      >
        {rimGradient && (
          <div
            className="w-full h-full rounded-[50%]"
            style={{
              background: topGradient,
              boxShadow: topShadow,
            }}
          />
        )}
      </div>
    </div>
  );
}

// Winter Fashion Sale hero banner matching the studio reference composition:
// soft blush-cream to dusty-rose diagonal wave backdrop, sweeping silky 3D pink waves,
// warm glowing white neon halo ring, two crisp snowflakes, three gold-rimmed cream
// cylindrical pedestals showcasing all 5 isolated PNGs from .refs/fashion_week_photos
// (vase with cotton blossoms, white low-top sneaker, pastel pink handbag, gradient
// sunglasses, and burgundy rhinestone mermaid gown), and crisp left promo copy.
function FashionHeroBanner({ banner }: { banner: BannerConfig }) {
  const VASE_URL = '/banners/fashion-vase.png';
  const SNEAKER_URL = '/banners/fashion-sneakers.png';
  const HANDBAG_URL = '/banners/fashion-handbag.png';
  const SUNGLASSES_URL = '/banners/fashion-sunglasses.png';
  const GOWN_URL = '/banners/fashion-dress.png';

  const pedestalProps = {
    topGradient: 'linear-gradient(135deg, #FFF7F4 0%, #FBE7DE 46%, #F4D5CA 82%, #EBC3B7 100%)',
    bodyGradient: 'linear-gradient(90deg, #EBC1B8 0%, #F7D9D0 14%, #FFF0E9 34%, #FCE3D8 56%, #F6D3C8 78%, #E7BEB4 94%, #DFB3A8 100%)',
    rimGradient: 'linear-gradient(125deg, #E5AA5E 0%, #FFF2C9 28%, #D39246 54%, #FBE0A6 78%, #C37E36 100%)',
    topShadow: 'inset 0 2px 5px rgba(180,115,85,0.14), inset 0 -1px 2px rgba(255,255,255,0.85)',
    bodyOverlayGradient: 'linear-gradient(to bottom, rgba(160,85,65,0.10) 0%, transparent 22%, rgba(160,85,65,0.08) 100%)',
  };

  const benefitPillClass =
    'inline-flex items-center gap-2 rounded-full bg-[#FDE4E0]/85 backdrop-blur-sm border border-[#EABAB6]/75 px-3 lg:px-3.5 py-1.5 text-[11px] lg:text-[12.5px] font-semibold text-[#4D1F24] shadow-[0_2px_10px_rgba(180,95,95,0.08),inset_0_1px_0_rgba(255,255,255,0.65)]';

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ─── Soft warm blush-cream -> rose -> dusty coral studio backdrop ─── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(108deg, #FCE7E3 0%, #FDE1DD 30%, #F4BDBB 56%, #E39594 78%, #D58080 100%)',
        }}
      />

      {/* Top-left bright pale blush glow behind promo copy */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 52% 65% at 22% 40%, rgba(255, 243, 240, 0.85) 0%, rgba(253, 228, 224, 0.42) 52%, transparent 80%)',
        }}
      />

      {/* Warm luminous stage glow behind the neon arch */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            'radial-gradient(circle at 72% 46%, rgba(255, 228, 220, 0.48) 0%, rgba(248, 178, 174, 0.22) 34%, transparent 60%)',
        }}
      />

      {/* ─── Upper & mid sweeping silky blush waves (behind arch) ─── */}
      <svg
        viewBox="0 0 2000 666"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fashion-left-silk" x1="0%" y1="0%" x2="88%" y2="92%">
            <stop offset="0%" stopColor="#FDF0ED" stopOpacity="0.98" />
            <stop offset="52%" stopColor="#FDE5E1" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FAD2CE" stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id="fashion-top-veil" x1="0%" y1="0%" x2="100%" y2="85%">
            <stop offset="0%" stopColor="#FFF7F5" stopOpacity="0.92" />
            <stop offset="65%" stopColor="#FDE4E0" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FCD3D0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fashion-right-shadow" x1="15%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stopColor="#EEACA9" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#DF8F8E" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#D17A7B" stopOpacity="0.96" />
          </linearGradient>
          <filter id="fashion-soft-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        {/* Smooth dusty rose right-side canvas flowing seamlessly under the diagonal curve */}
        <path
          d="M-10,-10 L2010,-10 L2010,676 L-10,676 Z"
          fill="url(#fashion-right-shadow)"
        />

        {/* Pale cream-blush sweeping diagonal left canvas (single clean silk curve) */}
        <path
          d="M-10,-10 L965,-10 C820,135 675,245 480,350 C310,440 155,495 -10,545 Z"
          fill="url(#fashion-left-silk)"
        />

        {/* Soft luminous blush veil transitioning under the diagonal sweep */}
        <path
          d="M-10,280 C240,220 490,235 765,335 C920,390 1015,470 1105,600 L-10,666 Z"
          fill="url(#fashion-left-silk)"
          opacity="0.48"
          filter="url(#fashion-soft-blur)"
        />

        {/* Soft luminous ribbon sweeping diagonally from top-left */}
        <path
          d="M-10,45 C210,8 430,22 670,108 C460,210 215,280 -10,365 Z"
          fill="url(#fashion-top-veil)"
          filter="url(#fashion-soft-blur)"
        />
      </svg>

      {/* ─── Left-side promotional copy & CTA ─── */}
      <div className="relative z-10 h-full flex flex-col justify-center pl-14 pr-14 sm:pl-16 md:pl-[max(3.75rem,6.3%)] md:pr-0 md:w-[54%]">
        <div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 sm:px-4 py-1.5 text-[10px] sm:text-[11px] lg:text-[12.5px] font-semibold uppercase tracking-[0.06em] text-white shadow-[0_6px_18px_rgba(176,12,64,0.28)]"
            style={{
              background: 'linear-gradient(90deg, #C80C46 0%, #B00A3E 100%)',
            }}
          >
            <SnowflakeIcon className="w-3.5 h-3.5 text-white shrink-0" />
            Limited Time Offer
          </span>
        </div>

        <h2 className="mt-2.5 sm:mt-3 lg:mt-3.5 text-2xl sm:text-3xl md:text-[28px] lg:text-[38px] xl:text-[48px] font-extrabold text-[#4D2722] tracking-[-0.025em] leading-[1.08] md:whitespace-nowrap">
          Winter Fashion{' '}
          <span className="bg-gradient-to-r from-[#C00942] via-[#D81350] to-[#DF1A58] bg-clip-text text-transparent">
            Sale
          </span>
        </h2>

        <p className="mt-2 sm:mt-2.5 text-[#4E2C28]/90 text-xs sm:text-sm md:text-[13px] lg:text-[15.5px] xl:text-[17px] font-medium leading-snug max-w-xl md:whitespace-nowrap">
          {banner.subtitle}
        </p>

        <div className="mt-3 sm:mt-4 lg:mt-5 hidden sm:flex flex-wrap items-center gap-2 lg:gap-2.5">
          <span className={benefitPillClass}>
            <FashionTagIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
            Up to 60% Off
          </span>
          <span className={benefitPillClass}>
            <Truck size={14} className="text-[#BD1B2F] shrink-0" strokeWidth={2.2} />
            Free Shipping
          </span>
          <span className={benefitPillClass}>
            <Undo2 size={14} className="text-[#BD1B2F] shrink-0" strokeWidth={2.2} />
            Easy Returns
          </span>
        </div>

        <div className="mt-4 sm:mt-5 lg:mt-6">
          <Link to={banner.link} className="inline-block">
            <Button className="group rounded-full bg-[#73091F] hover:bg-[#5E0618] text-white font-semibold px-6 sm:px-7 lg:px-8 py-2 sm:py-2.5 lg:py-3 h-auto text-xs sm:text-sm lg:text-[15.5px] shadow-[0_10px_24px_rgba(115,9,31,0.30)] cursor-pointer">
              {banner.cta}{' '}
              <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Glowing Neon Arch Ring (behind foreground waves, pedestals & products) ─── */}
      <div className="hidden md:block absolute inset-0 pointer-events-none z-[1]" aria-hidden="true">
        <div className="absolute left-[49.8%] top-[10.5%] w-[46.3%] aspect-square">
          <svg viewBox="0 0 400 400" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="fashion-arch-grad" x1="50%" y1="0%" x2="50%" y2="75%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="55%" stopColor="#FFF5F0" stopOpacity="0.96" />
                <stop offset="82%" stopColor="#FFE1D6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#FAD2C8" stopOpacity="0" />
              </linearGradient>
              <filter id="fashion-arch-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" />
              </filter>
            </defs>
            <circle
              cx="200"
              cy="200"
              r="194"
              fill="none"
              stroke="url(#fashion-arch-grad)"
              strokeWidth="18"
              opacity="0.62"
              filter="url(#fashion-arch-glow)"
            />
            <circle
              cx="200"
              cy="200"
              r="194"
              fill="none"
              stroke="#FFE4DA"
              strokeWidth="7"
              opacity="0.72"
              filter="url(#fashion-arch-glow)"
            />
            <circle
              cx="200"
              cy="200"
              r="194"
              fill="none"
              stroke="url(#fashion-arch-grad)"
              strokeWidth="2.4"
              opacity="0.96"
            />
          </svg>
        </div>
      </div>

      {/* ─── Foreground sweeping silky coral-pink bottom waves (overlap bottom of arch) ─── */}
      <svg
        viewBox="0 0 2000 666"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full pointer-events-none z-[2]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fashion-wave-right" x1="0%" y1="20%" x2="100%" y2="90%">
            <stop offset="0%" stopColor="#F5ACAC" />
            <stop offset="48%" stopColor="#F09898" />
            <stop offset="100%" stopColor="#EB8F90" />
          </linearGradient>
          <linearGradient id="fashion-wave-mid" x1="0%" y1="0%" x2="100%" y2="60%">
            <stop offset="0%" stopColor="#FBB8B6" />
            <stop offset="42%" stopColor="#FAD1CE" />
            <stop offset="72%" stopColor="#F5ACA8" />
            <stop offset="100%" stopColor="#F7B7B2" />
          </linearGradient>
          <linearGradient id="fashion-wave-front" x1="0%" y1="0%" x2="100%" y2="30%">
            <stop offset="0%" stopColor="#FBB0AF" />
            <stop offset="32%" stopColor="#FECAC8" />
            <stop offset="68%" stopColor="#FBC3B9" />
            <stop offset="100%" stopColor="#F4B0A9" />
          </linearGradient>
          <filter id="fashion-ridge-blur" x="-5%" y="-20%" width="110%" height="140%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>

        {/* Back-right rising coral wave that cleanly tucks over the arch's right foot */}
        <path
          d="M1260,666 L2010,666 L2010,350 C1865,375 1745,420 1630,475 C1495,540 1375,605 1260,666 Z"
          fill="url(#fashion-wave-right)"
        />
        <path
          d="M2010,350 C1865,375 1745,420 1630,475 C1540,518 1455,565 1375,610"
          fill="none"
          stroke="#FDD8D3"
          strokeWidth="6"
          opacity="0.55"
          filter="url(#fashion-ridge-blur)"
        />

        {/* Sweeping left-to-center sculptural silky wave */}
        <path
          d="M-10,398 C145,456 285,566 435,570 C585,574 690,460 825,460 C950,460 1030,575 1175,610 C1400,665 1710,555 2010,520 L2010,676 L-10,676 Z"
          fill="url(#fashion-wave-mid)"
        />
        {/* Soft luminous crest highlight along the sweeping mid wave */}
        <path
          d="M-10,400 C145,458 285,568 435,572 C585,576 690,462 825,462 C950,462 1030,575 1175,610"
          fill="none"
          stroke="#FFE8E4"
          strokeWidth="7"
          opacity="0.6"
          filter="url(#fashion-ridge-blur)"
        />

        {/* Overlapping front ribbon wave along bottom */}
        <path
          d="M-10,545 C165,606 345,648 545,636 C765,624 905,578 1095,606 C1330,640 1675,625 2010,590 L2010,676 L-10,676 Z"
          fill="url(#fashion-wave-front)"
        />
        <path
          d="M-10,547 C165,608 345,650 545,638 C765,626 905,580 1095,608"
          fill="none"
          stroke="#FFE7E3"
          strokeWidth="6"
          opacity="0.5"
          filter="url(#fashion-ridge-blur)"
        />
      </svg>

      {/* ─── Right-side 3D stage (snowflakes, 3 gold-rimmed pedestals, 5 products) ─── */}
      <div className="hidden md:block absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Two crisp decorative snowflakes */}
        <div className="absolute left-[51.1%] top-[10.1%] w-[2.8%] aspect-square z-[3] text-white/95 drop-shadow-[0_2px_6px_rgba(255,255,255,0.45)]">
          <SnowflakeIcon className="w-full h-full" />
        </div>
        <div className="absolute left-[92.7%] top-[9.0%] w-[3.8%] aspect-square z-[3] text-white/95 drop-shadow-[0_2px_8px_rgba(255,255,255,0.45)]">
          <SnowflakeIcon className="w-full h-full" />
        </div>

        {/* Back-Right gold-rimmed cylinder pedestal (under Pastel Pink Leather Handbag) */}
        <CylinderPedestal
          className="left-[66.5%] top-[54.4%] w-[17.3%] h-[40%] z-[2]"
          ellipseHeight="21%"
          {...pedestalProps}
        />

        {/* Back-Left gold-rimmed cylinder pedestal (under White Low-Top Sneaker) */}
        <CylinderPedestal
          className="left-[50.6%] top-[53.0%] w-[17.8%] h-[41%] z-[3]"
          ellipseHeight="20.5%"
          {...pedestalProps}
        />

        {/* Product 1 (tucked behind Sneaker & Handbag): Blush Pink Ribbed Vase with Cotton Blossoms */}
        <div
          className="absolute left-[62.0%] top-[15.0%] w-[8.8%] h-[39.8%] z-[4]"
          style={{ filter: 'drop-shadow(0 8px 14px rgba(130, 55, 55, 0.16))' }}
        >
          <img
            src={VASE_URL}
            alt=""
            className="w-full h-full object-contain object-bottom"
            draggable={false}
          />
        </div>

        {/* Sneaker contact shadow on Back-Left pedestal */}
        <div className="absolute left-[53.0%] top-[56.3%] w-[12.2%] h-[2.8%] rounded-[50%] bg-[#7D3A3A]/35 blur-[3.5px] z-[4]" />
        {/* Product 2 (back-left): White Low-Top Sneaker */}
        <div
          className="absolute left-[50.8%] top-[33.4%] w-[16.8%] h-[25.4%] z-[5]"
          style={{ filter: 'drop-shadow(0 10px 16px rgba(95, 42, 42, 0.22))' }}
        >
          <img
            src={SNEAKER_URL}
            alt=""
            className="w-full h-full object-contain object-bottom"
            draggable={false}
          />
        </div>

        {/* Handbag contact shadow on Back-Right pedestal */}
        <div className="absolute left-[68.0%] top-[57.6%] w-[12.6%] h-[2.8%] rounded-[50%] bg-[#8D4545]/32 blur-[4px] z-[4]" />
        {/* Product 3 (back-right): Pastel Pink Leather Handbag */}
        <div
          className="absolute left-[65.2%] top-[22.2%] w-[18.0%] h-[36.1%] z-[5]"
          style={{ filter: 'drop-shadow(0 12px 18px rgba(125, 52, 56, 0.22))' }}
        >
          <img
            src={HANDBAG_URL}
            alt=""
            className="w-full h-full object-contain object-bottom"
            draggable={false}
          />
        </div>

        {/* Front-Center pedestal floor shadow */}
        <div className="absolute left-[55.9%] top-[92.3%] w-[21.1%] h-[3.2%] rounded-[50%] bg-[#B56964]/45 blur-[4px] z-[5]" />
        {/* Front-Center gold-rimmed cylinder pedestal (under Gradient Sunglasses) */}
        <CylinderPedestal
          className="left-[55.7%] top-[73.6%] w-[21.5%] h-[20.6%] z-[6]"
          ellipseHeight="40%"
          roundedBottom
          {...pedestalProps}
        />

        {/* Sunglasses contact shadow on Front-Center pedestal */}
        <div className="absolute left-[59.6%] top-[77.3%] w-[13.6%] h-[2.6%] rounded-[50%] bg-[#7B4040]/32 blur-[3px] z-[6]" />
        {/* Product 4 (front-center): Glamorous Black and Gold Gradient Sunglasses */}
        <div
          className="absolute left-[58.5%] top-[62.9%] w-[16.5%] h-[16.5%] z-[7]"
          style={{ filter: 'drop-shadow(0 8px 12px rgba(80, 32, 36, 0.24))' }}
        >
          <img
            src={SUNGLASSES_URL}
            alt=""
            className="w-full h-full object-contain object-bottom"
            draggable={false}
          />
        </div>

        {/* Gown floor shadow */}
        <div className="absolute left-[74.2%] top-[95.2%] w-[21.2%] h-[3.8%] rounded-[50%] bg-[#5B0816]/45 blur-[5px] z-[7]" />
        {/* Product 5 (foreground right hero): Burgundy Rhinestone Mermaid Gown */}
        <div
          className="absolute left-[73.4%] top-[3.4%] w-[23.3%] h-[94.6%] z-[8]"
          style={{ filter: 'drop-shadow(0 14px 22px rgba(68, 8, 22, 0.34))' }}
        >
          <img
            src={GOWN_URL}
            alt=""
            className="w-full h-full object-contain object-bottom"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

// Home & Kitchen Fest hero banner matching the studio reference composition:
// deep pine-teal-to-emerald diagonal wave backdrop, cyan-mint neon halo ring,
// two 3D mint-teal cylindrical pedestals showcasing the curated kitchenware PNGs
// from .refs/kitchen_photos (cooking pot, gold-trimmed dinnerware set, ribbed-pot
// houseplant, wooden utensils crock, folded waffle tea towel, and spice jars),
// left promo copy with 3 glassmorphic benefit pills, and stacked 60% OFF badge.
function HomeKitchenHeroBanner({ banner }: { banner: BannerConfig }) {
  const POT_URL = '/banners/home-kitchen-pot.png';
  const PLATES_URL = '/banners/home-kitchen-plates.png';
  const PLANT_URL = '/banners/home-kitchen-plant.png';
  const UTENSILS_URL = '/banners/home-kitchen-utensils.png';
  const TOWEL_URL = '/banners/home-kitchen-towel.png';
  const SPICES_URL = '/banners/home-kitchen-spices.png';

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ─── Studio forest-emerald -> deep teal -> cyan-teal backdrop ─── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(112deg, #004237 0%, #005440 28%, #005B63 54%, #0B6F74 78%, #15747B 100%)',
        }}
      />
      {/* Top-right deep teal shadow corner */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 46% 48% at 94% 8%, rgba(0, 66, 78, 0.72) 0%, transparent 74%)',
        }}
      />
      {/* Bottom-left vibrant mint-emerald floor glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 46% 52% at 14% 92%, rgba(0, 198, 122, 0.56) 0%, rgba(0, 152, 98, 0.28) 52%, transparent 80%)',
        }}
      />
      {/* Soft radial cyan-mint studio aura behind the product stage */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            'radial-gradient(circle at 68.5% 48%, rgba(94, 234, 212, 0.30) 0%, rgba(20, 184, 166, 0.18) 28%, transparent 56%)',
        }}
      />

      {/* ─── Sweeping silky abstract diagonal curves ─── */}
      <svg
        viewBox="0 0 2000 666"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="kitchen-wave-top" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#025E4B" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#004C3E" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#004237" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="kitchen-wave-mid" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.14" />
            <stop offset="55%" stopColor="#14B8A6" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="kitchen-wave-bottom" x1="0%" y1="100%" x2="80%" y2="25%">
            <stop offset="0%" stopColor="#00B873" stopOpacity="0.68" />
            <stop offset="45%" stopColor="#10D294" stopOpacity="0.40" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="kitchen-wave-right" x1="100%" y1="100%" x2="30%" y2="20%">
            <stop offset="0%" stopColor="#0891B2" stopOpacity="0.42" />
            <stop offset="60%" stopColor="#0E7490" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0" />
          </linearGradient>
          <filter id="kitchen-wave-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <path d="M-40,-20 L420,-20 C255,155 155,245 -40,330 Z" fill="url(#kitchen-wave-top)" filter="url(#kitchen-wave-blur)" />
        <path d="M430,-20 L765,-20 C625,250 745,480 1120,686 L690,686 C455,480 355,235 430,-20 Z" fill="url(#kitchen-wave-mid)" filter="url(#kitchen-wave-blur)" />
        <path d="M-40,686 L-40,515 C245,565 485,525 895,686 Z" fill="url(#kitchen-wave-bottom)" filter="url(#kitchen-wave-blur)" />
        <path d="M2040,420 L2040,686 L1540,686 C1690,565 1840,485 2040,420 Z" fill="url(#kitchen-wave-right)" filter="url(#kitchen-wave-blur)" />
      </svg>

      {/* ─── Left-side promotional copy & CTA ─── */}
      <div className="relative z-10 h-full flex flex-col justify-center pl-14 pr-14 sm:pl-16 md:pl-[max(3.75rem,6%)] md:pr-0 md:w-[54%]">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] sm:text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.06em] text-white border border-[#6EE7B7]/40 shadow-[0_4px_16px_rgba(0,95,72,0.38)]"
            style={{
              background: 'linear-gradient(90deg, rgba(5, 146, 89, 0.88) 0%, rgba(13, 148, 120, 0.88) 100%)',
            }}
          >
            <Home size={12} className="text-white shrink-0" />
            Limited Time Offer
          </span>
        </div>

        <h2 className="mt-2.5 sm:mt-3 lg:mt-3.5 text-2xl sm:text-3xl md:text-[28px] lg:text-[38px] xl:text-[47px] font-black text-white tracking-[-0.02em] leading-[1.08] drop-shadow-md md:whitespace-nowrap">
          Home &amp; Kitchen{' '}
          <span className="bg-gradient-to-br from-[#D1FAE5] via-[#7AF5CE] to-[#4DE4C1] bg-clip-text text-transparent">
            Fest
          </span>
        </h2>

        <p className="mt-2 sm:mt-2.5 text-white/90 text-xs sm:text-sm md:text-[13px] lg:text-[15.5px] xl:text-[17px] font-medium leading-snug max-w-xl md:whitespace-nowrap">
          {banner.subtitle}
        </p>

        <BannerBenefitPills
          discountLabel="Up to 60% Off"
          pillClassName="bg-[#065E4D]/55"
          percentColorClass="text-[#D9F99D]"
        />

        <div className="mt-4 sm:mt-5 lg:mt-6">
          <Link to={banner.link} className="inline-block">
            <Button className="group rounded-full bg-white hover:bg-[#ECFDF5] text-[#052E28] font-bold px-5 sm:px-6 lg:px-7 py-2 sm:py-2.5 lg:py-3 h-auto text-xs sm:text-sm lg:text-[15px] shadow-[0_10px_28px_rgba(0,30,24,0.34)] cursor-pointer">
              {banner.cta}{' '}
              <ArrowRight size={15} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Right-side 3D studio stage (6 curated kitchen products + 2 mint-teal pedestals + neon arch + badge) ─── */}
      <div className="hidden md:block absolute inset-0 pointer-events-none" aria-hidden="true">
        <NeonArchRing
          className="left-[51%] top-[6.5%] w-[34.5%] z-[1]"
          gradientId="kitchen-arch-grad"
          filterId="kitchen-arch-glow"
          glowColor="#5EEAD4"
          stops={[
            { offset: '0%', color: '#99F6E4', opacity: 0.85 },
            { offset: '34%', color: '#FFFFFF', opacity: 1 },
            { offset: '65%', color: '#2DD4BF', opacity: 0.92 },
            { offset: '88%', color: '#0D9488', opacity: 0.6 },
            { offset: '100%', color: '#0F766E', opacity: 0.15 },
          ]}
        />

        {/* Back-left mint-teal cylinder pedestal (under Teal Cooking Pot) */}
        <CylinderPedestal
          className="left-[47.8%] top-[66.5%] w-[16.2%] h-[28.5%] z-[2]"
          ellipseHeight="20%"
          topGradient="linear-gradient(135deg, #FFFFFF 0%, #E0F7F4 48%, #B2E6DF 82%, #8AD6CE 100%)"
          bodyGradient="linear-gradient(90deg, #9EE5DD 0%, #D9F7F3 18%, #90DDD5 36%, #459D99 58%, #287474 82%, #479B9B 100%)"
          topShadow="inset 0 1px 2px rgba(255,255,255,0.95), inset 0 -1px 3px rgba(20,120,115,0.30), 0 0 14px rgba(153,246,228,0.25)"
        />

        {/* Front-right wide mint-teal cylinder pedestal (under Dinnerware, Plant, Utensils, Spice Jars & Tea Towel) */}
        <CylinderPedestal
          className="left-[57.8%] top-[74%] w-[35%] h-[26%] z-[3]"
          ellipseHeight="32%"
          topGradient="linear-gradient(135deg, #FFFFFF 0%, #DCF6F2 42%, #A6DFD9 78%, #7BC9C4 100%)"
          bodyGradient="linear-gradient(90deg, #9EE3DC 0%, #DDF8F4 16%, #95DCD5 34%, #50A8A4 58%, #348787 78%, #4DA6A3 92%, #68BDB9 100%)"
          topShadow="inset 0 1px 2px rgba(255,255,255,0.95), inset 0 -1px 3px rgba(20,120,115,0.28), 0 0 16px rgba(153,246,228,0.24)"
        />

        {/* Product 1 (back-right): Houseplant in Ribbed White Pot */}
        <div
          className="absolute left-[66.6%] top-[4.8%] w-[20.5%] h-[69.2%] z-[4]"
          style={{ filter: 'drop-shadow(0 12px 20px rgba(0, 48, 44, 0.30))' }}
        >
          <img src={PLANT_URL} alt="" className="w-full h-full object-contain object-bottom" draggable={false} />
        </div>

        {/* Product 2 (center): Gold-Trimmed Leaf Dinnerware Set */}
        <div
          className="absolute left-[59.8%] top-[28.5%] w-[18.4%] h-[51.7%] z-[5]"
          style={{ filter: 'drop-shadow(0 12px 18px rgba(8, 52, 50, 0.30))' }}
        >
          <img src={PLATES_URL} alt="" className="w-full h-full object-contain object-bottom" draggable={false} />
        </div>

        {/* Teal Pot contact shadow on Pedestal 1 */}
        <div className="absolute left-[50.9%] top-[69.3%] w-[11.4%] h-[2.8%] rounded-[50%] bg-[#093D3B]/45 blur-[4px] z-[6]" />
        {/* Product 3 (left): Deep Teal Ribbed Cooking Pot (overlaps left rim of large dinner plate) */}
        <div
          className="absolute left-[50%] top-[43.2%] w-[13.3%] h-[28%] z-[7]"
          style={{ filter: 'drop-shadow(0 12px 18px rgba(4, 42, 42, 0.36))' }}
        >
          <img src={POT_URL} alt="" className="w-full h-full object-contain object-bottom" draggable={false} />
        </div>

        {/* Utensils contact shadow on right side of Pedestal 2 */}
        <div className="absolute left-[84.1%] top-[77.5%] w-[6.8%] h-[2.4%] rounded-[50%] bg-[#0B4B4A]/42 blur-[3px] z-[6]" />
        {/* Product 4 (right): Wooden Kitchen Utensils in White Ceramic Crock */}
        <div
          className="absolute left-[82.8%] top-[41.2%] w-[9.4%] h-[37.8%] z-[7]"
          style={{ filter: 'drop-shadow(0 10px 16px rgba(6, 48, 48, 0.32))' }}
        >
          <img src={UTENSILS_URL} alt="" className="w-full h-full object-contain object-bottom" draggable={false} />
        </div>

        {/* Spice Jars contact shadow */}
        <div className="absolute left-[75.8%] top-[79.6%] w-[9.3%] h-[2.2%] rounded-[50%] bg-[#0A4947]/45 blur-[3px] z-[7]" />
        {/* Product 5 (front-right): Glass Spice Jars on Wooden Tray */}
        <div
          className="absolute left-[75.5%] top-[65.8%] w-[9.9%] h-[15.4%] z-[8]"
          style={{ filter: 'drop-shadow(0 8px 14px rgba(6, 44, 44, 0.34))' }}
        >
          <img src={SPICES_URL} alt="" className="w-full h-full object-contain object-bottom" draggable={false} />
        </div>

        {/* Tea Towel soft contact shadow */}
        <div className="absolute left-[62.8%] top-[80.5%] w-[11.5%] h-[3.5%] rounded-[50%] bg-[#0A4947]/30 blur-[5px] z-[7]" />
        {/* Product 6 (front-left draped over pedestal lip): Folded Striped Waffle Tea Towel */}
        <div
          className="absolute left-[61.8%] top-[74.5%] w-[13.8%] h-[26.5%] z-[8]"
          style={{ filter: 'drop-shadow(0 10px 14px rgba(6, 44, 44, 0.30))' }}
        >
          <img src={TOWEL_URL} alt="" className="w-full h-full object-contain object-top" draggable={false} />
        </div>

        {/* Top-right "Up to 60% OFF" frosted squircle badge */}
        <BannerDiscountBadge
          percent="60%"
          positionClassName="top-[8.5%] right-[3.6%]"
          cardClassName="bg-[#E8F6F4]/95 shadow-[0_12px_32px_rgba(0,40,38,0.22)]"
          percentColorClass="text-[#0F766E]"
        />
      </div>
    </div>
  );
}

// Mega Electronics Sale hero banner matching the studio reference composition:
// deep cobalt-to-purple diagonal wave backdrop, glowing neon halo ring,
// three 3D cylindrical pedestals displaying all four transparent product PNGs
// from .refs/electronics_photos (laptop, smartwatch, wireless earbuds, headphones),
// left promo copy with 3 glassmorphic benefit pills, and stacked 75% OFF badge.
function ElectronicsHeroBanner({ banner }: { banner: BannerConfig }) {
  const LAPTOP_URL = '/banners/electronics-laptop.png';
  const HEADPHONES_URL = '/banners/electronics-headphones.png';
  const SMARTWATCH_URL = '/banners/electronics-smartwatch.png';
  const EARBUDS_URL = '/banners/electronics-earbuds.png';

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* ─── Studio cobalt -> indigo -> neon purple backdrop ─── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(112deg, #011857 0%, #01206B 28%, #1C2698 52%, #4D31D2 74%, #7339EE 90%, #8C44F9 100%)',
        }}
      />
      {/* Top-right deeper indigo corner */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 46% 48% at 94% 6%, rgba(20, 14, 112, 0.78) 0%, transparent 74%)',
        }}
      />
      {/* Bottom-right luminous purple floor glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 45% 48% at 88% 95%, rgba(171, 88, 255, 0.78) 0%, rgba(133, 74, 248, 0.38) 48%, transparent 78%)',
        }}
      />
      {/* Soft radial studio aura behind the product cluster */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            'radial-gradient(circle at 69.5% 48%, rgba(105, 178, 255, 0.34) 0%, rgba(124, 118, 248, 0.20) 26%, transparent 54%)',
        }}
      />

      {/* ─── Sweeping silky abstract diagonal curves ─── */}
      <svg
        viewBox="0 0 2000 666"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="elec-wave-top" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#04309A" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#022073" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#011857" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="elec-wave-mid" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.14" />
            <stop offset="55%" stopColor="#3B82F6" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="elec-wave-bottom" x1="0%" y1="100%" x2="80%" y2="30%">
            <stop offset="0%" stopColor="#0A3DB0" stopOpacity="0.68" />
            <stop offset="45%" stopColor="#1A65EE" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
          <filter id="elec-wave-blur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        <path
          d="M-40,-20 L410,-20 C250,155 150,245 -40,330 Z"
          fill="url(#elec-wave-top)"
          filter="url(#elec-wave-blur)"
        />
        <path
          d="M420,-20 L760,-20 C620,250 740,480 1120,686 L690,686 C450,480 350,235 420,-20 Z"
          fill="url(#elec-wave-mid)"
          filter="url(#elec-wave-blur)"
        />
        <path
          d="M-40,686 L-40,515 C240,565 480,525 890,686 Z"
          fill="url(#elec-wave-bottom)"
          filter="url(#elec-wave-blur)"
        />
      </svg>

      {/* ─── Left-side promotional copy & CTA ─── */}
      <div className="relative z-10 h-full flex flex-col justify-center pl-14 pr-14 sm:pl-16 md:pl-[max(3.75rem,6%)] md:pr-0 md:w-[54%]">
        <div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] sm:text-[11px] lg:text-[12px] font-bold uppercase tracking-[0.06em] text-white border border-white/20 shadow-[0_4px_16px_rgba(37,99,235,0.35)]"
            style={{
              background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.88) 0%, rgba(99, 70, 246, 0.9) 100%)',
            }}
          >
            <Zap size={12} className="text-white fill-white shrink-0" />
            Limited Time Offer
          </span>
        </div>

        <h2 className="mt-2.5 sm:mt-3 lg:mt-3.5 text-2xl sm:text-3xl md:text-[28px] lg:text-[38px] xl:text-[47px] font-black text-white tracking-[-0.02em] leading-[1.08] drop-shadow-md md:whitespace-nowrap">
          Mega Electronics{' '}
          <span className="italic bg-gradient-to-br from-[#F4EBFF] via-[#D0AAFF] to-[#AC72FF] bg-clip-text text-transparent pr-1.5">
            Sale
          </span>
        </h2>

        <p className="mt-2 sm:mt-2.5 text-white/90 text-xs sm:text-sm md:text-[13px] lg:text-[15.5px] xl:text-[17px] font-medium leading-snug max-w-xl md:whitespace-nowrap">
          {banner.subtitle}
        </p>

        <BannerBenefitPills
          discountLabel="Up to 75% Off"
          pillClassName="bg-[#0F2470]/55"
        />

        <div className="mt-4 sm:mt-5 lg:mt-6">
          <Link to={banner.link} className="inline-block">
            <Button className="group rounded-full bg-white hover:bg-[#F4F7FF] text-[#071442] font-bold px-5 sm:px-6 lg:px-7 py-2 sm:py-2.5 lg:py-3 h-auto text-xs sm:text-sm lg:text-[15px] shadow-[0_10px_28px_rgba(3,10,45,0.36)] cursor-pointer">
              {banner.cta}{' '}
              <ArrowRight size={15} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Right-side 3D product stage (4 products + 3 cylinder pedestals + neon arch + badge) ─── */}
      <div className="hidden md:block absolute inset-0 pointer-events-none" aria-hidden="true">
        <NeonArchRing
          className="left-[52.5%] top-[4%] w-[34%] z-[1]"
          gradientId="elec-arch-grad"
          filterId="elec-arch-glow"
          glowColor="#67E8F9"
          stops={[
            { offset: '0%', color: '#DDD6FE', opacity: 0.85 },
            { offset: '32%', color: '#FFFFFF', opacity: 1 },
            { offset: '62%', color: '#67E8F9', opacity: 0.95 },
            { offset: '86%', color: '#A855F7', opacity: 0.65 },
            { offset: '100%', color: '#8B5CF6', opacity: 0.15 },
          ]}
        />

        {/* Back-center cylinder pedestal (under Laptop) */}
        <CylinderPedestal
          className="left-[58.4%] top-[50.5%] w-[26.8%] h-[30%] z-[2]"
          ellipseHeight="17.5%"
          topGradient="linear-gradient(135deg, #FFFFFF 0%, #EBE8FF 48%, #CEC4FF 82%, #B19DFF 100%)"
          bodyGradient="linear-gradient(90deg, #989DFD 0%, #6A5AE8 28%, #4F3ECD 58%, #6B4EF2 84%, #9569FF 100%)"
        />
        {/* Laptop contact shadow */}
        <div className="absolute left-[61.6%] top-[51.6%] w-[20.6%] h-[3.2%] rounded-[50%] bg-[#19115C]/45 blur-[4px] z-[2]" />

        {/* Product 1: Laptop (Lenovo) */}
        <div
          className="absolute left-[61.1%] top-[14.2%] w-[21.9%] h-[40.5%] z-[3]"
          style={{ filter: 'drop-shadow(0 16px 26px rgba(10, 8, 52, 0.4))' }}
        >
          <img
            src={LAPTOP_URL}
            alt=""
            className="w-full h-full object-contain object-bottom"
            draggable={false}
          />
        </div>

        {/* Front-left cylinder pedestal (under Smartwatch) */}
        <CylinderPedestal
          className="left-[49%] top-[68.5%] w-[16.5%] h-[28.5%] z-[4]"
          ellipseHeight="18%"
          topGradient="linear-gradient(135deg, #FFFFFF 0%, #F1F0FF 48%, #D6D6FF 80%, #B8B2FF 100%)"
          bodyGradient="linear-gradient(90deg, #869DFB 0%, #D4DEFF 18%, #909DF7 36%, #5656D9 58%, #403BB0 78%, #6355DB 94%, #826DF4 100%)"
        />

        {/* Front-right wide cylinder pedestal (under Wireless Earbuds & Headphones) */}
        <CylinderPedestal
          className="left-[60.5%] top-[77.5%] w-[32.7%] h-[22.5%] z-[6]"
          ellipseHeight="31%"
          topGradient="linear-gradient(135deg, #FFFFFF 0%, #F6F3FF 44%, #DFD5FF 76%, #C3A6FF 100%)"
          bodyGradient="linear-gradient(90deg, #98A3FB 0%, #D3D7FF 15%, #9B98F9 32%, #6150DC 54%, #4D3CC5 72%, #8657F9 88%, #BA77FF 100%)"
        />
        {/* Smartwatch contact shadow */}
        <div className="absolute left-[53.5%] top-[70.1%] w-[7.6%] h-[2.5%] rounded-[50%] bg-[#171263]/50 blur-[3px] z-[4]" />

        {/* Product 2: Smartwatch */}
        <div
          className="absolute left-[52.8%] top-[41.2%] w-[8.8%] h-[30.6%] z-[5]"
          style={{ filter: 'drop-shadow(0 12px 18px rgba(12, 10, 56, 0.36))' }}
        >
          <img
            src={SMARTWATCH_URL}
            alt=""
            className="w-full h-full object-contain object-bottom"
            draggable={false}
          />
        </div>

        {/* Earbuds contact shadow */}
        <div className="absolute left-[66%] top-[79.6%] w-[5.7%] h-[2.4%] rounded-[50%] bg-[#22187A]/40 blur-[3px] z-[7]" />
        {/* Product 3: Open White Wireless Earbuds Case */}
        <div
          className="absolute left-[65.6%] top-[59%] w-[6.5%] h-[22%] z-[7]"
          style={{ filter: 'drop-shadow(0 8px 14px rgba(24, 18, 86, 0.34))' }}
        >
          <img
            src={EARBUDS_URL}
            alt=""
            className="w-full h-full object-contain object-bottom"
            draggable={false}
          />
        </div>

        {/* Headphones contact shadow */}
        <div className="absolute left-[79.6%] top-[79.4%] w-[9.8%] h-[2.8%] rounded-[50%] bg-[#19105E]/50 blur-[4px] z-[7]" />
        {/* Product 4: Black Wireless Headphones */}
        <div
          className="absolute left-[79%] top-[38.2%] w-[11.6%] h-[42.8%] z-[7]"
          style={{ filter: 'drop-shadow(0 14px 20px rgba(15, 10, 62, 0.42))' }}
        >
          <img
            src={HEADPHONES_URL}
            alt=""
            className="w-full h-full object-contain object-bottom"
            draggable={false}
          />
        </div>

        {/* Top-right "Up to 75% OFF" frosted squircle badge */}
        <BannerDiscountBadge
          percent="75%"
          positionClassName="top-[13.5%] right-[3.1%]"
          cardClassName="bg-[#ECEAFD]/95 shadow-[0_12px_32px_rgba(15,10,60,0.22)]"
          percentColorClass="text-[#6D1CF2]"
        />
      </div>
    </div>
  );
}

/* ─── Product Carousel ─── */
function ProductCarousel({ title, subtitle, icon: Icon, products, loading, viewAllLink }: {
  title: string; subtitle?: string; icon: any; products: any[]; loading: boolean; viewAllLink?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScroll);
    updateScroll();
    return () => el.removeEventListener('scroll', updateScroll);
  }, [updateScroll, products]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 bg-indigo-100/80 dark:bg-muted rounded-2xl animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-36 bg-indigo-100/80 dark:bg-muted rounded animate-pulse" />
            <div className="h-3.5 w-48 bg-indigo-100/60 dark:bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="min-w-[196px] h-[330px] bg-white/70 dark:bg-muted/50 rounded-[20px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  if (products.length === 0) return null;

  const pillBtnClass =
    'border border-indigo-200/80 dark:border-border bg-gradient-to-b from-white via-[#F6F6FF] to-[#ECEDFE] dark:from-card dark:to-card shadow-[0_4px_12px_-2px_rgba(79,70,229,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-none hover:border-indigo-300 transition-all';

  return (
    <section>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-11 w-11 md:h-12 md:w-12 rounded-2xl shrink-0 flex items-center justify-center border border-indigo-200/75 dark:border-indigo-500/25 bg-gradient-to-br from-white via-[#F1F1FF] to-[#E5E7FE] dark:from-indigo-500/20 dark:via-indigo-500/15 dark:to-purple-500/15 shadow-[0_6px_16px_-4px_rgba(99,102,241,0.18),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:shadow-none">
            <Icon size={21} strokeWidth={2.2} className="text-[#3730A3] dark:text-indigo-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-[22px] font-black text-slate-900 dark:text-foreground tracking-[-0.02em] leading-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs md:text-[13px] font-medium text-slate-500 dark:text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs md:text-[13px] font-bold text-[#1E1B4B] dark:text-indigo-200 hover:shadow-[0_6px_16px_-2px_rgba(79,70,229,0.22)] ${pillBtnClass}`}
            >
              View All <ArrowRight size={14} strokeWidth={2.4} />
            </Link>
          )}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${title} left`}
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-slate-800 dark:text-foreground disabled:opacity-40 disabled:cursor-default cursor-pointer ${pillBtnClass}`}
            >
              <ChevronLeft size={16} strokeWidth={2.3} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label={`Scroll ${title} right`}
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-slate-800 dark:text-foreground disabled:opacity-40 disabled:cursor-default cursor-pointer ${pillBtnClass}`}
            >
              <ChevronRight size={16} strokeWidth={2.3} />
            </button>
          </div>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3.5 md:gap-4 overflow-x-auto pt-1 pb-5 -mx-2 px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}>
        {products.map((p) => (
          <div key={p._id} className="flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
            <ProductCard product={p} compact />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══ MAIN DASHBOARD ═══ */
export default function Dashboard() {
  const { isAdmin } = useAuth();
  if (isAdmin) return <AdminDashboard />;
  return <CustomerDashboard />;
}

function CustomerDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  const fetchProducts = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    setLoadError(false);
    const maxAttempts = 4;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await api.get('/products?limit=200');
        if (signal?.cancelled) return;
        setProducts(res.data.data || []);
        setLoading(false);
        return;
      } catch (err: any) {
        if (signal?.cancelled) return;
        const status = err?.response?.status;
        const isTransient = !status || status >= 500;
        if (attempt < maxAttempts && isTransient) {
          await new Promise((r) => setTimeout(r, attempt * 1200));
          continue;
        }
        setLoadError(true);
        setLoading(false);
        return;
      }
    }
  }, []);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchProducts(signal);
    return () => { signal.cancelled = true; };
  }, [fetchProducts]);

  useEffect(() => {
    const t = setInterval(() => setBannerIndex(p => (p + 1) % BANNERS.length), 6000);
    return () => clearInterval(t);
  }, []);

  const getByCategory = (cat: string) =>
    products.filter(p => p.category?.toLowerCase().includes(cat.toLowerCase()) || p.name?.toLowerCase().includes(cat.toLowerCase())).slice(0, 15);
  const trending = [...products].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 15);
  const bestSellers = [...products].sort((a, b) => (b.stock || 0) - (a.stock || 0)).slice(0, 15);
  const electronics = getByCategory('electronic');
  const fashion = getByCategory('fashion');
  const homeKitchen = getByCategory('home');

  return (
    <div className="space-y-8">
      {/* ═══ HERO BANNER ═══ */}
      <section className="relative rounded-3xl overflow-hidden h-[260px] sm:h-[310px] md:h-[340px] lg:h-[385px] xl:h-[416px]">
        {BANNERS.map((b, i) => (
          <div
            key={i}
            aria-hidden={i !== bannerIndex}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${i === bannerIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'}`}
          >
            {b.productsVariant === 'electronics' ? (
              <ElectronicsHeroBanner banner={b} />
            ) : b.productsVariant === 'fashion' ? (
              <FashionHeroBanner banner={b} />
            ) : b.productsVariant === 'homeKitchen' ? (
              <HomeKitchenHeroBanner banner={b} />
            ) : (
              <>
                <div className={`absolute inset-0 bg-gradient-to-r ${b.gradient}`} />
                <div className="relative z-10 h-full flex items-center justify-between px-8 md:px-16">
                  <div className="max-w-lg">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-black text-white tracking-tight leading-[1.08] drop-shadow-lg">{b.title}</h2>
                    <p className="text-white/80 text-sm md:text-base mt-2.5 max-w-md leading-relaxed">{b.subtitle}</p>
                    <Link to={b.link} className="mt-5 inline-block">
                      <Button className="group bg-white text-gray-900 hover:bg-gray-100 font-bold shadow-xl px-6 py-2.5 h-auto text-sm rounded-xl">
                        {b.cta} <ArrowRight size={15} className="ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {(() => {
          const isFashionSlide = BANNERS[bannerIndex]?.productsVariant === 'fashion';
          const arrowClasses = isFashionSlide
            ? 'bg-[#F8D6D3]/80 border-[#FFFFFF]/65 text-[#5D1A25] hover:bg-[#F8D6D3] shadow-[0_6px_18px_rgba(120,40,48,0.14)]'
            : 'bg-white/15 border-white/15 text-white hover:bg-white/25 shadow-lg';
          const dotsWrapClasses = isFashionSlide
            ? 'bg-[#B76865]/75 border-white/15'
            : 'bg-black/30 border-white/10';
          return (
            <>
              <div className={`absolute bottom-3.5 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 backdrop-blur-md border rounded-full px-3 py-1.5 transition-colors duration-300 ${dotsWrapClasses}`}>
                {BANNERS.map((_, i) => (
                  <button key={i} onClick={() => setBannerIndex(i)} aria-label={`Go to banner ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === bannerIndex ? 'w-6 md:w-7 bg-white' : 'w-2 bg-white/45 hover:bg-white/70'}`} />
                ))}
              </div>
              <button onClick={() => setBannerIndex(p => (p - 1 + BANNERS.length) % BANNERS.length)} aria-label="Previous banner"
                className={`absolute left-3 md:left-3.5 top-1/2 -translate-y-1/2 z-20 h-9 w-9 md:h-10 md:w-10 rounded-full border backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${arrowClasses}`}>
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => setBannerIndex(p => (p + 1) % BANNERS.length)} aria-label="Next banner"
                className={`absolute right-3 md:right-3.5 top-1/2 -translate-y-1/2 z-20 h-9 w-9 md:h-10 md:w-10 rounded-full border backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${arrowClasses}`}>
                <ChevronRight size={20} />
              </button>
            </>
          );
        })()}
      </section>

      {/* ═══ TRUST BADGES ═══ */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4">
        {[
          {
            label: 'Free Shipping',
            desc: 'Orders over ₹999',
            borderColor: 'rgba(96, 165, 250, 0.85)',
            bg: 'linear-gradient(108deg, rgba(255,255,255,0.97) 0%, #F0F6FF 54%, #DCEBFF 100%)',
            shadow: '0 6px 18px -4px rgba(59, 130, 246, 0.22), inset 0 0 0 1.5px rgba(255, 255, 255, 0.92)',
            tileBg: 'linear-gradient(145deg, #EFF6FF 0%, #CBE2FF 58%, #B2D4FF 100%)',
            tileShadow: '0 4px 10px rgba(59, 130, 246, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
            waveBack: '#93C5FD',
            waveFront: '#60A5FA',
            icon: <Truck size={23} strokeWidth={2.2} className="text-[#1D5CE5]" />,
          },
          {
            label: 'Secure Payment',
            desc: '100% protected',
            borderColor: 'rgba(52, 211, 153, 0.85)',
            bg: 'linear-gradient(108deg, rgba(255,255,255,0.97) 0%, #EEFEF6 54%, #CFFCE4 100%)',
            shadow: '0 6px 18px -4px rgba(16, 185, 129, 0.22), inset 0 0 0 1.5px rgba(255, 255, 255, 0.92)',
            tileBg: 'linear-gradient(145deg, #EEFFF5 0%, #C3F7D7 58%, #A8F0C6 100%)',
            tileShadow: '0 4px 10px rgba(16, 185, 129, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
            waveBack: '#6EE7B7',
            waveFront: '#34D399',
            icon: (
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden="true">
                <path
                  d="M12 2.4L4.6 5.6V11.4C4.6 16.2 7.75 20.55 12 21.8C16.25 20.55 19.4 16.2 19.4 11.4V5.6L12 2.4Z"
                  fill="#0EA968"
                />
                <path
                  d="M9.1 12.1L11.15 14.15L15.3 9.95"
                  stroke="#FFFFFF"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          },
          {
            label: 'Easy Returns',
            desc: '7-day policy',
            borderColor: 'rgba(251, 146, 60, 0.85)',
            bg: 'linear-gradient(108deg, rgba(255,255,255,0.97) 0%, #FFF6EE 54%, #FFE0C7 100%)',
            shadow: '0 6px 18px -4px rgba(249, 115, 22, 0.22), inset 0 0 0 1.5px rgba(255, 255, 255, 0.92)',
            tileBg: 'linear-gradient(145deg, #FFF6EE 0%, #FFD9B8 58%, #FFC599 100%)',
            tileShadow: '0 4px 10px rgba(249, 115, 22, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
            waveBack: '#FDBA74',
            waveFront: '#FB923C',
            icon: <RotateCcw size={22} strokeWidth={2.4} className="text-[#EA580C]" />,
          },
          {
            label: '24/7 Support',
            desc: 'Always here',
            borderColor: 'rgba(168, 85, 247, 0.82)',
            bg: 'linear-gradient(108deg, rgba(255,255,255,0.97) 0%, #F8F2FF 54%, #E9D3FF 100%)',
            shadow: '0 6px 18px -4px rgba(147, 51, 234, 0.22), inset 0 0 0 1.5px rgba(255, 255, 255, 0.92)',
            tileBg: 'linear-gradient(145deg, #F8F2FF 0%, #E5CEFF 58%, #D6B7FF 100%)',
            tileShadow: '0 4px 10px rgba(147, 51, 234, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
            waveBack: '#D8B4FE',
            waveFront: '#C084FC',
            icon: <Headphones size={22} strokeWidth={2.2} className="text-[#7C3AED]" />,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-[18px] border-[1.5px] px-4 py-3.5 lg:px-5 lg:py-4 flex items-center gap-3.5 dark:brightness-95"
            style={{
              borderColor: item.borderColor,
              background: item.bg,
              boxShadow: item.shadow,
            }}
          >
            {/* Subtle glossy top sheen */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0) 48%)',
              }}
              aria-hidden="true"
            />
            {/* Bottom-right translucent curved waves */}
            <svg
              viewBox="0 0 300 90"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full pointer-events-none"
              aria-hidden="true"
            >
              <path
                d="M175,90 C215,65 250,42 300,34 L300,90 Z"
                fill={item.waveBack}
                opacity="0.32"
              />
              <path
                d="M210,90 C245,74 268,58 300,52 L300,90 Z"
                fill={item.waveFront}
                opacity="0.24"
              />
            </svg>
            <div
              className="relative z-10 h-12 w-12 lg:h-[52px] lg:w-[52px] rounded-[14px] flex items-center justify-center shrink-0 border border-white/80"
              style={{
                background: item.tileBg,
                boxShadow: item.tileShadow,
              }}
            >
              {item.icon}
            </div>
            <div className="relative z-10 min-w-0">
              <p className="text-[14px] lg:text-[15.5px] font-extrabold text-slate-900 tracking-[-0.015em] leading-tight">
                {item.label}
              </p>
              <p className="text-[12px] lg:text-[13px] font-medium text-slate-600 leading-snug mt-0.5">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* ═══ FLASH DEALS ═══ */}
      <FlashDealsBanner />

      {/* ═══ TRENDING PRODUCTS ═══ */}
      {loadError ? (
        <section className="bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Package size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-foreground">Unable to load products right now</h3>
          <p className="text-sm text-gray-500 dark:text-muted-foreground max-w-md mx-auto">
            The product catalog service may still be starting up or temporarily unavailable.
          </p>
          <Button onClick={() => fetchProducts()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <RotateCcw size={14} /> Retry Loading Products
          </Button>
        </section>
      ) : !loading && products.length === 0 ? (
        <section className="bg-white dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-muted text-slate-500 flex items-center justify-center mx-auto">
            <Package size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-foreground">No products available yet</h3>
          <p className="text-sm text-gray-500 dark:text-muted-foreground">Check back soon or refresh to load the latest catalog.</p>
          <Button variant="outline" onClick={() => fetchProducts()} className="gap-2">
            <RotateCcw size={14} /> Refresh
          </Button>
        </section>
      ) : null}

      <ProductCarousel
        title="Trending Now"
        subtitle="Most popular products this week"
        icon={TrendingUp}
        products={trending}
        loading={loading}
        viewAllLink="/products"
      />

      {/* ═══ CATEGORY-BASED SECTIONS ═══ */}
      {electronics.length > 0 && (
        <ProductCarousel
          title="Electronics"
          subtitle="Latest gadgets & electronic essentials"
          icon={Zap}
          products={electronics}
          loading={loading}
          viewAllLink={categoryProductsUrl('Electronics')}
        />
      )}
      {fashion.length > 0 && (
        <ProductCarousel
          title="Fashion"
          subtitle="Stylish apparel, footwear & accessories"
          icon={Shirt}
          products={fashion}
          loading={loading}
          viewAllLink={categoryProductsUrl('Fashion')}
        />
      )}
      {homeKitchen.length > 0 && (
        <ProductCarousel
          title="Home & Kitchen"
          subtitle="Curated essentials for modern living"
          icon={Home}
          products={homeKitchen}
          loading={loading}
          viewAllLink={categoryProductsUrl('Home & Kitchen')}
        />
      )}

      {/* ═══ BEST SELLERS ═══ */}
      <ProductCarousel
        title="Best Sellers"
        subtitle="Top-rated customer favorites"
        icon={Flame}
        products={bestSellers}
        loading={loading}
        viewAllLink="/products"
      />

      {/* ═══ BOTTOM CTA ═══ */}
      <section
        className="relative rounded-[24px] border border-indigo-200/70 dark:border-indigo-500/25 overflow-hidden min-h-[210px] md:h-[224px] flex items-center px-6 py-8 md:px-10 md:py-0"
        style={{
          background:
            'linear-gradient(102deg, #D8D1FE 0%, #ECE8FF 26%, #FAF9FF 50%, #F1ECFF 76%, #D3C3FE 100%)',
          boxShadow: '0 12px 32px -8px rgba(99, 102, 241, 0.18), inset 0 0 0 1px rgba(255,255,255,0.85)',
        }}
      >
        {/* Silky pastel lavender layered wave ribbons */}
        <svg
          viewBox="0 0 1248 224"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full pointer-events-none dark:opacity-15"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="cta-wave-left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C9BEFF" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#EFEBFF" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="cta-wave-right" x1="20%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E6DFFF" stopOpacity="0.35" />
              <stop offset="55%" stopColor="#C8B6FE" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#B89FFE" stopOpacity="0.68" />
            </linearGradient>
          </defs>
          <path
            d="M0,120 C140,85 265,165 430,190 L430,224 L0,224 Z"
            fill="url(#cta-wave-left)"
          />
          <path
            d="M460,224 C660,210 835,145 975,78 C1080,28 1170,12 1248,18 L1248,224 Z"
            fill="url(#cta-wave-right)"
          />
          <path
            d="M680,224 C860,185 1030,125 1248,132 L1248,224 Z"
            fill="#C7B6FE"
            opacity="0.45"
          />
          <path
            d="M460,224 C660,210 835,145 975,78 C1080,28 1170,12 1248,18"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            opacity="0.6"
          />
        </svg>

        {/* Left: 3D Shopping Cart with Gifts (.refs/bottom_website) */}
        <div
          className="hidden md:block absolute left-[4.2%] bottom-[2%] w-[24%] h-[96%] z-10 pointer-events-none"
          style={{ filter: 'drop-shadow(0 12px 20px rgba(88, 56, 175, 0.24))' }}
          aria-hidden="true"
        >
          <img
            src="/banners/bottom-shopping-cart.png"
            alt=""
            className="w-full h-full object-contain object-bottom"
            draggable={false}
          />
        </div>

        {/* Subtle vertical divider between cart showcase & CTA text */}
        <div
          className="hidden md:block absolute left-[31.8%] top-1/2 -translate-y-1/2 w-px h-[62%] bg-indigo-300/55 z-10"
          aria-hidden="true"
        />

        {/* Right-center: Explore Our Full Collection copy & purple pill CTA */}
        <div className="relative z-10 w-full md:pl-[34.5%] text-center md:text-left">
          <div className="inline-flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
            <h3 className="text-2xl sm:text-[28px] lg:text-[33px] font-black text-slate-950 tracking-[-0.025em] leading-tight">
              Explore Our Full{' '}
              <span className="relative inline-block bg-gradient-to-r from-[#6E26EC] to-[#5B21D6] bg-clip-text text-transparent pb-1.5">
                Collection
                <svg
                  viewBox="0 0 180 14"
                  className="absolute left-0 -bottom-0.5 w-full h-2.5 text-[#6E26EC] pointer-events-none"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8.5C52 3 125 2.5 177 9.5"
                    stroke="currentColor"
                    strokeWidth="4.2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h3>
            <svg
              viewBox="0 0 36 32"
              className="w-7 h-6 text-[#6828E1] shrink-0 -mt-2 hidden sm:block"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 1L14.4 7.6L21 10L14.4 12.4L12 19L9.6 12.4L3 10L9.6 7.6Z" />
              <path d="M27 14L28.5 18.5L33 20L28.5 21.5L27 26L25.5 21.5L21 20L25.5 18.5Z" />
            </svg>
          </div>

          <p className="text-slate-600 text-sm md:text-[15.5px] font-medium mt-1.5">
            {products.length}+ products waiting for you across all categories
          </p>

          <Link to="/products" className="mt-4 inline-block">
            <Button
              className="group rounded-full text-white font-bold px-6 py-3 h-auto text-sm md:text-[15px] cursor-pointer border border-white/25"
              style={{
                background: 'linear-gradient(90deg, #7C19EE 0%, #5A1CE6 54%, #3D19DB 100%)',
                boxShadow:
                  '0 10px 24px -4px rgba(98, 28, 235, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.28)',
              }}
            >
              <ShoppingBag size={16} className="mr-2" />
              Browse All Products
              <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
