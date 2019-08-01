var cardComponent = {
  data: function() {
    return {
      editing: this.initialEditing,
      originalFront: '',
      originalBack: '',
      originalTags: [],
      newtag: '',
    }
  },
  props: ['card', 'isNew', 'initialEditing'],
  created: function() {
    this.debouncedRenderMathJax = _.debounce(this.renderMathJax, 100);
  },
  watch: {
    card: {
      handler: function(newCard, oldCard) {
	this.debouncedRenderMathJax();
      },
      deep: true
    },
  },
  methods: {
    renderMathJax: function() {
      this.$nextTick(function() {
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.$el]);
      })
    },
    startEdit: function() {
      this.originalFront = this.card.front;
      this.originalBack = this.card.back;
      this.originalTags = [...this.card.tag];
      this.editing = true;
      this.renderMathJax();
    },
    saveEdit: function() {
      // Can't save an empty card.
      if (this.card.front === '' || this.card.back === '') {
	window.alert('Card must have both front and back text!');
	return;
      }

      this.editing = false;
      this.renderMathJax();
      
      // Only emit a save event if something has changed.
      var tagsChanged = false;
      if (this.card.tag.length != this.originalTags.length) {
	tagsChanged = true;
      } else {
	for (var i = 0; i < this.card.tag.length; ++i) {
	  if (this.card.tag[i] !== this.originalTags[i]) {
	    tagsChanged = true;
	    break;
	  }
	}
      }
      if (this.card.front !== this.originalFront ||
	  this.card.back !== this.originalBack || tagsChanged) {
	this.$emit('save-card', this.card);
      }
    },
    cancelEdit: function() {
      // If this is a new card, we want to either outright delete it if it
      // blank, or alert if there is anything entered before deleting. Either
      // way, there is nothing to restore.
      if (this.isNew) {
	if ((this.card.front === '' &&
	     this.card.back === '') ||
	    window.confirm('Do you want to lose all input and abandon this new card?')) {
	  this.$emit('remove');
	}
	return;
      }
      // Otherwise, restore the previous state of the card.
      this.card.front = this.originalFront;
      this.card.back = this.originalBack;
      this.card.tag = [...this.originalTags];
      this.editing = false;
      this.newtag = '';
      this.renderMathJax();
    },
    addTag: function() {
      if (this.newtag == '') return;
      this.card.tag.push(this.newtag);
      this.newtag = '';
    },
    deleteTag: function(index) {
      this.card.tag.splice(index, 1);
    }
  },
  // TODO(piotrf): do I need to use v-html?
  template: `
<div v-if="editing" class="editingnote">
  <div>
    <div class="editingnotecards">
      <div>
        <div v-html="card.front" class="card"></div>
        <div v-html="card.back" class="card"></div>
      </div>
      <div>
        <div class="editingcardtext">
          <textarea v-model="card.front" draggable='false'></textarea>
        </div>
        <div class="editingcardtext">
          <textarea v-model="card.back" draggable='false'></textarea>
        </div>
      </div>
    </div>
    <div class="editingcardtags">
      <ul>
        <li v-for="(tag, index) in card.tag">
          {{ tag }}
          <button v-on:click.stop="deleteTag(index)">x</button>
        </li>
      </ul>
      <span>
        <input v-model="newtag">
        <button v-on:click.stop="addTag">Add</button>
      </span>
    </div>
  </div>
  <div class="editingcardbuttons">
    <button class="savebutton" v-on:click.stop="saveEdit">Save</button>
    <button class="cancelbutton" v-on:click.stop="cancelEdit">Cancel</button>
    <button v-on:click.stop="$emit('remove')">Delete</button>
  </div>
</div>	  
<div v-else class="note" v-on:click="startEdit">
  <div v-html="card.front" class="card"></div>
  <div v-html="card.back" class="card"></div>
  <div class="tags">
    <ul>
      <li v-for="tag in card.tag">{{ tag }}</li>
    </ul>
  </div>
</div>
`
}

var app = new Vue({
  el: '#app',
  components: {
    'card-component': cardComponent,
  },
  data: {
    cards: [],
    query: '',
    queryTags: [],
  },
  mounted: function() {
    fetch('/api/cards')
      .then(r => r.json())
      .then(json => {
	// Unpack card data and sort by newest first.
	// If a card doesn't have any tags, create an empty array for it.
	// This simplifies later code.
	this.cards = json.map(x => {
	  var rObj = {};
	  rObj.data = x;
	  if (!('tag' in rObj.data)) {
	    rObj.data.tag = [];
	  }
	  return rObj;
	});
	this.cards.sort((a, b) => b.data.createdTs - a.data.createdTs);

	// Calculate the tags present in the cards, and sort by most popular.
	var tagToCount = new Map();
	for (var i = 0; i < this.cards.length; ++i) {
	  for (var j = 0; j < this.cards[i].data.tag.length; ++j) {
	    var tag = this.cards[i].data.tag[j];
	    if (tagToCount.has(tag)) {
	      tagToCount.set(tag, tagToCount.get(tag) + 1);
	    } else {
	      tagToCount.set(tag, 1);
	    }
	  }
	}
	var sortedTags = Array.from(tagToCount.entries());
	sortedTags.sort((a, b) => b[1] - a[1]);
	for (var i = 0; i < sortedTags.length; ++i) {
	  this.queryTags.push({
	    'name': sortedTags[i][0],
	    'selected': false
	  });
	}
      });
  },
  computed: {
    filteredCards: function() {
      var selectedQueryTags = this.queryTags.filter(tag => tag.selected);
      if (selectedQueryTags.length == 0) {
	return this.cards;
      } else {
	return this.cards.filter(function (card) {
	  for (const queryTag of selectedQueryTags) {
	    if (!card.data.tag.includes(queryTag.name)) {
	      return false;
	    }
	  }
	  return true;
	});
      }
    }
  },
  methods: {
    newCard: function() {
      const newCard = {
	data: {
	  front: '',
	  back: '',
	  tag: [],
	},
	isNew: true,
	editing: true,
      }
      this.cards.unshift(newCard);
    },
    saveCard: function(id, card) {
      const index = this.cards.findIndex(card => card.data.id == id);
      if (index == -1) {
	console.error('saveCard: no card with id', id);
	return;
      }
      
      this.cards[index].data = card;
      // If this is a new card, then call the create URL. We'll also need
      // to update the id afterwards.
      if (this.cards[index].isNew) {
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
	  return response;
	  })
	  .then(response => response.json())
	  .then(data => {
	    this.cards[index].isNew = false;
	    this.cards[index].data.id = data.id;
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
    deleteCard: function(id) {
      const index = this.cards.findIndex(card => card.data.id == id);
      if (index == -1) {
	console.error('deleteCard: no card with id', id);
	return;
      }
      
      // For new cards, just delete them from the array. They haven't yet been
      // saved to the server.
      if (this.cards[index].isNew) {
	this.cards.splice(index, 1);
	return;
      }
      // For non-new cards, confirm before actually deleting.
      if (!window.confirm('Really delete the card?')) {
	return;
      }
      fetch('/api/cards/' + this.cards[index].data.id, {
	method: 'DELETE',
      }).then(response => {
	if (response.ok) {
	  this.cards.splice(index, 1);
	} else {
	  return Promise.reject(new Error(response.statusText));
	}
      })
      .catch(error => {
	console.error('Error in delete:', error.message)
	window.alert('Error in delete: ' + error.message)
      });
    },
    toggleQueryTag: function(index) {
      this.queryTags[index].selected = !this.queryTags[index].selected;
    }
  },
});
