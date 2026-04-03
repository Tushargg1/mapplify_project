import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';

function cls(...parts) {
  return parts.filter(Boolean).join(' ');
}

export default function MaplifyLogo({
  text = 'Maplify',
  className = '',
  as: Tag = 'span',
  shuffleOnHover = true,
}) {
  const wrapperRef = useRef(null);
  const charRefs = useRef([]);

  const characters = useMemo(() => Array.from(text), [text]);

  const animate = useCallback(() => {
    if (!charRefs.current.length) return;

    gsap.killTweensOf(charRefs.current);

    gsap.fromTo(
      charRefs.current,
      {
        opacity: 0,
        x: () => gsap.utils.random(-14, 14),
        y: () => gsap.utils.random(-10, 10),
        rotate: () => gsap.utils.random(-8, 8),
        filter: 'blur(5px)',
      },
      {
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        filter: 'blur(0px)',
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.04,
      },
    );
  }, []);

  useEffect(() => {
    animate();
  }, [animate, text]);

  return React.createElement(
    Tag,
    {
      ref: wrapperRef,
      className: cls('inline-flex items-baseline select-none', className),
      onMouseEnter: shuffleOnHover ? animate : undefined,
      'aria-label': text,
    },
    characters.map((char, index) => (
      <span
        key={`${char}-${index}`}
        ref={(node) => {
          if (node) {
            charRefs.current[index] = node;
          }
        }}
        className="inline-block will-change-transform"
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    )),
  );
}
