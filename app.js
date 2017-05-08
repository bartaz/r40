// PLAYER (NAME) COMPONENT
// =========================

Vue.component('player', {
  template: '<span :style="{ color: player.colour }">{{ player.name }}</span>',
  props: ['player']
})

// PLAYER SELECT COMPONENT
// =========================
Vue.component('player-select', {
  template: '#player-select-template',
  data: function() {
    return { players: [
      { checked: true, name: "Player 1", colour: "red" },
      { checked: true, name: "Player 2", colour: "green" },
      { checked: true, name: "Player 3", colour: "blue" },
      { checked: false, name: "Player 4", colour: "yellow" },
      { checked: false, name: "Player 5", colour: "purple" },
      { checked: false, name: "Player 6", colour: "brown" }
    ] }
  },
  computed: {
    checkedPlayers: function() {
      return this.players.filter(function(p) {
        return p.checked;
      });
    },
    numberOfPlayers: function() {
      return this.checkedPlayers.length
    }
  },
  methods: {
    startGame: function() {
      this.$emit('start', this.checkedPlayers)
    }
  }
});

// GAME COMPONENT
// ================

Vue.component('game', {
  template: '#game-template',
  props: ['players'],
  data: function() {
    return {
      round: 1,
      activeRound: null
    }
  },
  methods: {
    startRound: function(time) {
      this.activeRound = {
        players: this.players,
        time: time
      }
    },
    endRound: function() {
      this.activeRound = null;
      this.round = this.round + 1;

      var player = this.players.shift();
      this.players.push(player);
    }
  }
})


// ROUND COMPONENT

Vue.component('round', {
  template: '<turn v-if="currentTurn !== null" :player="currentTurn.player" :time="currentTurn.time" :round="round" @endTurn="endTurn" @endRound="endRound"></turn>',
  props: ['round', 'players', 'time'],
  data: function() {
    var self = this;
    return {
      playerTimes: this.players.map(function(player) {
        return { player: player, time: self.time }
      }),
      currentPlayerId: 0,
      currentTurn: null
    }
  },
  computed: {
    activeTurns: function() {
      return this.playerTimes.filter(function (turn) { return (turn.time === null) || (turn.time > 0) });
    }
  },
  mounted: function() {
    this.currentPlayerId = 0;
    this.currentTurn = this.playerTimes[0];
  },
  methods: {
    endTurn: function(time) {
      this.currentTurn.time = time;

      if (this.activeTurns.length) {
        // next turn
        var nextPlayer = this.currentPlayerId + 1;
        if (!this.playerTimes[nextPlayer]) {
          nextPlayer = 0;
        }
        this.currentPlayerId = nextPlayer;
        this.currentTurn = this.playerTimes[nextPlayer];
      } else {
        // end round
        this.endRound();
      }
    },
    endRound: function() {
      // end round
      this.currentPlayerId = null;
      this.currentTurn = null;
      this.$emit('endRound');
    }
  }
});

// TURN COMPONENT
// ================

Vue.component('turn', {
  template: '#turn-template',
  props: ['round', 'player', 'time'],
  data: function() {
    return {
      currentTime: this.time,
      interval: null
    }
  },
  watch: {
    player: function(player1, player2) {
      if (this.time) {
        this.startTimer(this.time);
      }
    }
  },
  mounted: function() {
    if (this.time) {
      this.startTimer(this.time);
    }
  },
  methods: {
    startTimer: function(time) {
      this.currentTime = time;
      var self = this;

      this.interval = setInterval(function() {
        self.currentTime = self.currentTime -1;
        if (self.currentTime < 0) {
          self.stopTimer();
        }
      }, 1000);
    },
    stopTimer: function() {
      this.currentTime = 0;
      clearInterval(this.interval);
      this.interval = null;
    },
    endTurn: function() {
      var time = this.currentTime;
      this.stopTimer();
      this.$emit('endTurn', time);
    },
    endRound: function() {
      this.stopTimer();
      this.$emit('endRound');
    }
  }
});

// APP
// =====

var app = new Vue({
  el: '#app',
  data: {
    screen: "home", // "game", // TODO: turn into dynamic <component>
    players: [],
  },
  methods: {
    startGame: function(players) {
      this.players = players;
      this.screen = "game";
    }
  }
});
