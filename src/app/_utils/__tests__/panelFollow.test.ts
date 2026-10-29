import { describe, it, expect } from 'vitest';
import { followDelta } from '../panelFollow';

describe('followDelta', () => {
    it('is 0 when the row is already inside the window', () => expect(followDelta({ top: 120, bottom: 150, windowTop: 100, windowBottom: 400 })).toBe(0));
    it('comes up by exactly the shortfall', () => expect(followDelta({ top: 60, bottom: 90, windowTop: 100, windowBottom: 400 })).toBe(-40));
    it('goes down by exactly the overhang', () => expect(followDelta({ top: 390, bottom: 420, windowTop: 100, windowBottom: 400 })).toBe(20));
    it('never scrolls a tall row\'s own top out of view', () => expect(followDelta({ top: 150, bottom: 900, windowTop: 100, windowBottom: 400 })).toBe(50));
});
