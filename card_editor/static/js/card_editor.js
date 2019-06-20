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
      // If this is a new card, we want to either outright delete it if it
      // blank, or alert if there is anything entered before deleting. Either
      // way, there is nothing to restore.
      if (this.cards[index].new) {
	if ((this.cards[index].data.front === '' &&
	     this.cards[index].data.back === '') ||
	    window.confirm('Do you want to lose all input and abandon this new card?')) {
	  this.cards.splice(index, 1);
	}
	return;
      }
      // Otherwise, restore the previous state of the card.
      this.cards[index].data.front = this.cards[index].originalFront;
      this.cards[index].data.back = this.cards[index].originalBack;
      this.cards[index].editing = false;
    },
    saveEdit: function(index) {
      // Can't save an empty card.
      if (this.cards[index].data.front === '' ||
	  this.cards[index].data.back === '') {
	window.alert('Card must have both front and back text!');
	return;
      }

      // If we haven't changed anything, don't bother saving.
      if (this.cards[index].data.front === this.cards[index].originalFront &&
	  this.cards[index].data.back === this.cards[index].originalBack) {
	this.cards[index].editing = false;
	return;
      }

      // If this is a new card, then call the create URL. We'll also need
      // to update the id afterwards.
      if (this.cards[index].new) {
	fetch('/api/cards/create', {
	  method: 'PUT',
	  headers: {
	    'Content-Type': 'application/json',
	  },
	  body: JSON.stringify(this.cards[index].data),
	}).then(response => {
	    if (!response.ok) {
	      return Promise.reject(new Error(response.statusText));
	    }
	  })
	  .then(response => response.json())
	  .then(data => {
	    this.cards.new = false;
	    this.cards[index].id = data.id;
	    this.cards[index].editing = false;
	  })
	  .catch(error => {
	    console.error('Error in save:', error.message)
	    window.alert('Error in save: ' + error.message)
	  });
      } else {
	fetch('/api/cards/' + this.cards[index].data.id, {
	  method: 'PUT',
	  headers: {
	    'Content-Type': 'application/json',
	  },
	  body: JSON.stringify(this.cards[index].data),
	}).then(
	  response => {
	    if (response.ok) {
	      this.cards[index].editing = false;
	    } else {
	      return Promise.reject(new Error(response.statusText));
	    }
	  })
	  .catch(error => {
	    console.error('Error in save:', error.message)
	    window.alert('Error in save: ' + error.message)
	  });
      }
    },
    newCard: function() {
      var newCard = {
	data: {
	  front: '',
	  back: '',
	  tag: [],
	},
	editing: true,
	new: true,
	originalFront: '',
	originalBack: '',
      }
      this.cards.unshift(newCard);
    },
  },
});
