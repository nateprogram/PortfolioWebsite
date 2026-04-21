import type { SVGProps } from "react";

// PyTorch flame, from Simple Icons (CC0). The brand orange reads well on
// both light and dark themes, so it is hard-coded rather than currentColor.
const PyTorch = (props: SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="#EE4C2C" viewBox="0 0 24 24">
    <path d="M12.005 0L4.952 7.053a9.865 9.865 0 000 14.022 9.866 9.866 0 0014.022 0c3.984-3.9 3.986-10.205.085-14.023l-1.744 1.743c2.904 2.905 2.904 7.634 0 10.538s-7.634 2.904-10.538 0-2.904-7.634 0-10.538l4.647-4.646.582-.665zm3.568 3.899a1.327 1.327 0 00-1.327 1.327 1.327 1.327 0 001.327 1.328A1.327 1.327 0 0016.9 5.226 1.327 1.327 0 0015.573 3.9z" />
  </svg>
);

export { PyTorch };
