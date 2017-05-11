// PLAYER (NAME) COMPONENT
// =========================

Vue.component('player', {
  template: '<span :style="{ color: player.colour }">{{ player.name }}</span>',
  props: ['player']
})

// PLAYER SELECT COMPONENT
// =========================
Vue.component('player-select', {
  template: '                                                                   \
    <div>                                                                       \
      Wybierz graczy:                                                           \
      <ul id="example-1">                                                       \
        <li v-for="player in players" :style="{ color: player.colour }">        \
          <label>                                                               \
            <input                                                              \
              v-model="player.checked"                                          \
              type="checkbox"                                                   \
              :disabled="player.checked && numberOfPlayers === 3"               \
             />                                                                 \
            <player :player="player"></player>                                  \
          </label>                                                              \
        </li>                                                                   \
      </ul>                                                                     \
      <p>Liczba graczy: {{ numberOfPlayers }}</p>                               \
      <button v-on:click="startGame">                                           \
       Start gry                                                                \
      </button>                                                                 \
    </div>                                                                      \
  ',
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
  template: '                                                                   \
    <div>                                                                       \
      <player-select v-if="!players" @start="startGame" />                      \
      <div v-else-if="!activeRound">                                            \
        <p>Runda: {{round}}</p>                                                 \
        <p>Pierwszy gracz: <player :player="players[0]" /></p>                  \
        <p><button @click="startRound(null)">Start rundy [∞]</button></p>       \
        <p><button @click="startRound(40)">Start rundy [40s]</button></p>       \
        <p><button @click="startRound(35)">Start rundy [35s]</button></p>       \
        <p><button @click="startRound(30)">Start rundy [30s]</button></p>       \
        <p><button @click="startRound(25)">Start rundy [25s]</button></p>       \
        <p><button @click="startRound(20)">Start rundy [20s]</button></p>       \
        <p><button @click="players = null">Koniec gry</button></p>              \
      </div>                                                                    \
      <round                                                                    \
        v-else-if="activeRound"                                                 \
        :players="activeRound.players"                                          \
        :time="activeRound.time"                                                \
        :round="round"                                                          \
        @endRound="endRound">                                                   \
      </round>                                                                  \
    </div>                                                                      \
  ',
  data: function() {
    return {
      round: 1,
      activeRound: null,
      players: null
    }
  },
  methods: {
    startGame: function(players) {
      this.round = 1;
      this.players = players;
    },
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
  template: '                                                                   \
    <div>                                                                       \
      <p>Runda: {{round}}</p>                                                   \
      <p>Tura gracza: <player :player="player"></player></p>                    \
      <p>                                                                       \
        <timer :player="player" :time="currentTime" @touchend.native="endTurn"> \
        </timer>                                                                \
      </p>                                                                      \
      <p><button @click="endTurn">Następna tura</button></p>                    \
      <p><button @click="endRound">Koniec rundy</button></p>                    \
    </div>                                                                      \
  ',
  props: ['round', 'player', 'time'],
  data: function() {
    return {
      currentTime: this.time,
      interval: null,
      keyboardCallback: null
    }
  },
  watch: {
    player: function(player1, player2) {
      if (this.time) {
        this.startTimer(this.time);
      }

      if (this.time === 0) {
        this.endTurn();
      }
    }
  },
  mounted: function() {
    if (this.time) {
      this.startTimer(this.time);
    }
    var self = this;
    this.keyboardCallback = function(event){
      if (event.keyCode === 32) {
        self.endTurn();
      }
    }
    document.addEventListener('keyup', this.keyboardCallback);
  },
  destroyed: function() {
    document.removeEventListener('keyup', this.keyboardCallback);
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
      if (this.currentTime) {
        this.currentTime = 0;
      }
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


// TIME COMPONENT
// ================

Vue.component('timer', {
  template: '<div class="time" :style="style">{{ displayTime }}</div>',
  props: ['player', 'time'],
  computed: {
    displayTime: function () {
      return this.time === null ? "∞" : this.time;
    },
    style: function() {
      return {
        backgroundColor: this.player.colour
      }
    }
  }
});

// APP
// =====

var app = new Vue({
  template: '<game />',
  el: '#app',
});
