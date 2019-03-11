var data = {
  cards: [
    {
      id: 1,
      front: 'How do you represent the hypothesis for linear regression with \\(n\\) dimensional features?',
      back: '\\[h_{\\theta}(x) = \\theta^T x\\] where \\(\\theta, x \\in \\mathbb{R}^{n+1}, x_0=1\\) by definition.',
      editing: false,
    },
    {
      id: 2,
      front: 'What is the "Mean Squared Error" (MSE) for a classifier \\(h\\), given \\(m\\) examples?',
      back: '\\[J(\\theta)=\\frac{1}{2} \\sum^{m}_{i=1}(h_\\theta(x^{(i)})-y^{(i)})^2\\]',
      editing: false,
    },
    {
      id: 3,
      front: 'What is the gradient descent update for an objective \\(J(\\theta)\\)?',
      back: '\\[\\theta_{i} := \\theta_{i} - \\alpha \\frac{\\partial J}{\\partial \\theta_i}\\biggr\\rvert_{\\theta_i}\\]',
      editing: false,
    },
    {
      id: 4,
      front: 'For \\(A \\in \\mathbb{R}^{n \\times n}\\), does \\(\\mathrm{tr} A = \\mathrm{tr} A^{T}\\)?',
      back: 'Yes',
      editing: false,
    }
  ],
};

var app = new Vue({
  el: '#app',
  data: data,
  watch: {
    cards: {
      handler: function(newCards, oldCards) {
	this.debouncedRenderMathJax();
      },
      deep: true
    },
  },
  created: function() {
    this.debouncedRenderMathJax = _.debounce(this.renderMathJax, 100);
  },
  mounted(){
    this.renderMathJax();
  },
  methods: {
    renderMathJax: function() {
      this.$nextTick(function() {
	// TODO(piotrf): could probably get better performance specifying
	// which element to typeset.
	MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
      })
    },
    startEdit: function(index) {
      this.cards[index].editing = true;
      this.cards[index].originalFront = this.cards[index].front;
      this.cards[index].originalBack = this.cards[index].back;
    },
    cancelEdit: function(index) {
      this.cards[index].editing = false;
      this.cards[index].front = this.cards[index].originalFront;
      this.cards[index].back = this.cards[index].originalBack;
    }
  },
});
