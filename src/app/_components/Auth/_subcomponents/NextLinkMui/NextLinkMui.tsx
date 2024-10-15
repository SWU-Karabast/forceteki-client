import React, { forwardRef } from "react";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import MuiLink, { LinkProps as MuiLinkProps } from "@mui/material/Link";

type CombinedLinkProps = NextLinkProps & MuiLinkProps;

/**
 * A combined Next.js and Material-UI Link component.
 * This component leverages Next.js's Link for client-side navigation
 * and Material-UI's Link for styling.
 */
const NextLinkMui = forwardRef<HTMLAnchorElement, CombinedLinkProps>(
	({ href, ...props }, ref) => (
		<NextLink href={href} passHref legacyBehavior>
			<MuiLink ref={ref} {...props} />
		</NextLink>
	)
);

NextLinkMui.displayName = "NextLinkMui";

export default NextLinkMui;
