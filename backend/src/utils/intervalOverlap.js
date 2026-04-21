/**
 * Preklapanje poluotvorenih intervala [a0,a1) i [b0,b1) u minutima (ili drugoj jedinici).
 */
function intervalOverlap(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1;
}

module.exports = { intervalOverlap };
