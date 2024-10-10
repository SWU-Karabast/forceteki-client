import { useRef, useEffect, useState, useCallback } from "react";

export const useDragScroll = (
	direction: "horizontal" | "vertical" = "horizontal"
) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isScrolling, setIsScrolling] = useState(false);
	const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	let startX: number;
	let startY: number;
	let scrollStart: number;

	const startScrolling = () => {
		setIsScrolling(true);
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}
	};

	const resetScrollingState = () => {
		scrollTimeoutRef.current = setTimeout(() => {
			setIsScrolling(false);
		}, 150);
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		setIsDragging(true);
		startScrolling();
		if (direction === "horizontal") {
			startX = e.pageX - (containerRef.current?.offsetLeft || 0);
			scrollStart = containerRef.current?.scrollLeft || 0;
		} else {
			startY = e.pageY - (containerRef.current?.offsetTop || 0);
			scrollStart = containerRef.current?.scrollTop || 0;
		}
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging) return;
		e.preventDefault();
		startScrolling();
		if (direction === "horizontal") {
			const x = e.pageX - (containerRef.current?.offsetLeft || 0);
			const walk = (x - startX) * 1.5;
			if (containerRef.current) {
				containerRef.current.scrollLeft = scrollStart - walk;
			}
		} else {
			const y = e.pageY - (containerRef.current?.offsetTop || 0);
			const walk = (y - startY) * 1.5;
			if (containerRef.current) {
				containerRef.current.scrollTop = scrollStart - walk;
			}
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
		resetScrollingState();
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		setIsDragging(true);
		startScrolling();
		if (direction === "horizontal") {
			startX = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
			scrollStart = containerRef.current?.scrollLeft || 0;
		} else {
			startY = e.touches[0].pageY - (containerRef.current?.offsetTop || 0);
			scrollStart = containerRef.current?.scrollTop || 0;
		}
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isDragging) return;
		e.preventDefault();
		startScrolling();
		if (direction === "horizontal") {
			const x = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
			const walk = (x - startX) * 1.5;
			if (containerRef.current) {
				containerRef.current.scrollLeft = scrollStart - walk;
			}
		} else {
			const y = e.touches[0].pageY - (containerRef.current?.offsetTop || 0);
			const walk = (y - startY) * 1.5;
			if (containerRef.current) {
				containerRef.current.scrollTop = scrollStart - walk;
			}
		}
	};

	const handleTouchEnd = () => {
		setIsDragging(false);
		resetScrollingState();
	};

	const handleWheel = useCallback(
		(e: WheelEvent) => {
			if (containerRef.current) {
				e.preventDefault();
				startScrolling();
				if (direction === "horizontal") {
					containerRef.current.scrollLeft += e.deltaY;
				} else {
					containerRef.current.scrollTop += e.deltaY;
				}
				resetScrollingState();
			}
		},
		[direction]
	);

	useEffect(() => {
		const container = containerRef.current;
		if (container) {
			container.addEventListener("wheel", handleWheel, { passive: false });
		}
		return () => {
			if (container) {
				container.removeEventListener("wheel", handleWheel);
			}
			if (scrollTimeoutRef.current) {
				clearTimeout(scrollTimeoutRef.current);
			}
		};
	}, [handleWheel]);

	return {
		containerRef,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd,
		isDragging,
		isScrolling,
	};
};
