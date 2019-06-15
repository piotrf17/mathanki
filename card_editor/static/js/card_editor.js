var data = {
  cards: [
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
    fetch('/api/cards')
      .then(r => r.json())
      .then(json => {
	this.cards = json.map(x => { var rObj = {}; rObj.data = x; return rObj; });
	for (var i = 0; i < data.cards.length; ++i) {
	  Vue.set(this.cards[i], 'editing', false);
	}
      });
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
      this.cards[index].originalFront = this.cards[index].data.front;
      this.cards[index].originalBack = this.cards[index].data.back;
      this.cards[index].editing = true;
    },
    cancelEdit: function(index) {
      this.cards[index].front = this.cards[index].data.originalFront;
      this.cards[index].back = this.cards[index].data.originalBack;
      this.cards[index].editing = false;
    },
    saveEdit: function(index) {	
      fetch('/api/cards/' + this.cards[index].data.id, {
	method: 'PUT',
	headers: {
	  'Content-Type': 'application/json',
	},
	body: JSON.stringify(this.cards[index].data),
      }).then(
	response => {
	  if (response.status !== 200) {
	    // TODO(piotrf): figure out how to raise this error as a
	    // notification.
	    response.json().then(data => {
	      console.error('Request error: ', data.error);
	    });
	    return;
	  }
	})
	.catch(error => console.error('Fetch error:', error));
      this.cards[index].editing = false;
    }
  },
});
