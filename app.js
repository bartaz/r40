// PLAYER (NAME) COMPONENT
// =========================

Vue.component('player', {
  template: '<span :class="classNames">{{ player.name }}</span>',
  props: ['player'],
  computed: {
    classNames: function() {
      return [ 'player', this.player.color ];
    }
  }
})

// PLAYER (INPUT) COMPONENT
// =========================

Vue.component('player-input', {
  template: '<input :class="classNames" v-model="player.name"></input>',
  props: ['player'],
  computed: {
    classNames: function() {
      return [ 'player-input', this.player.color ];
    }
  }
})

// PLAYER COLOR COMPONENT
// ========================

// icon source: https://thenounproject.com/term/meeple/1269/
var meeple = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path class="meeple" fill-rule="evenodd" clip-rule="evenodd" d="M100 43c.6-13.7-32.4-20.4-33.8-22C65.5 20.2 68 0 50 0 32 0 34.5 20.2 33.8 21 32.4 22.6-.6 29.3 0 43c.6 13.8 18 6.7 21.8 10.8C25 57.3 6.5 80 4.4 94.4 3.8 99 5 100 9.6 100H33c3.4 0 4.5-2 6.2-4.5 3.8-5.8 8.3-15 10.8-15s7 9.2 10.8 15c1.7 2.6 2.8 4.5 6 4.5h23.6c4.5 0 5.8-1 5.2-5.6-2-14.4-20.6-37-17.4-40.6 3.7-4 21.2 3 21.8-10.8z"/></svg>';

Vue.component('player-color', {
  template: '<button :class="classNames" @click.stop.prevent="changeColor">'+ meeple +'</button>',
  props: ['player'],
  computed: {
    classNames: function() {
      return ['color', this.player.color]
    },
    nextColor: function() {
      var colors = ["red", "green", "blue", "yellow", "purple", "brown"];

      var current = colors.indexOf(this.player.color);
      var next = current < colors.length-1 ? current + 1 : 0;

      return colors[next];
    }
  },
  methods: {
    changeColor: function() {
      this.player.color = this.nextColor;
    }
  }
});

// PLAYER SELECT COMPONENT
// =========================
Vue.component('player-select', {
  template: '                                                                   \
    <div class="player-select">                                                 \
      Wybierz graczy:                                                           \
      <ul id="example-1">                                                       \
        <li v-for="player in players" :class="{ disabled: !player.checked }">   \
          <label>                                                               \
            <input                                                              \
              v-model="player.checked"                                          \
              type="checkbox"                                                   \
              :disabled="player.checked && numberOfPlayers === 3"               \
             />                                                                 \
            <player-color :player="player"></player-color>                      \
            <player-input :player="player"></player-input>                      \
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
      { checked: true, name: "Player 1", color: "red" },
      { checked: true, name: "Player 2", color: "green" },
      { checked: true, name: "Player 3", color: "blue" },
      { checked: false, name: "Player 4", color: "yellow" },
      { checked: false, name: "Player 5", color: "purple" },
      { checked: false, name: "Player 6", color: "brown" }
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
      initSound();

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
        return {
          player: player,
          time: self.time === null ? self.time : self.time * 100 }
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
          playExplosion();

          self.stopTimer();
        }
      }, 10);
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
  template: '                                                                   \
    <div :class="classNames">                                                   \
      <span class="seconds">                                                    \
        {{ displaySeconds }}</span><span class="miliseconds">{{ displayMiliseconds }} \
      </span>                                                                   \
    </div>',
  props: ['player', 'time'],
  computed: {
    displaySeconds: function() {
      if (this.time === null) {
        return "∞"
      }
      return (this.seconds < 10 ? "0" : "") + this.seconds;
    },
    displayMiliseconds: function() {
      if (this.time === null) {
        return ""
      }
      return ":" + ~~(this.miliseconds / 10);
    },
    seconds: function () {
      return  s = ~~(this.time / 100);
    },
    miliseconds: function () {
      return this.time - (this.seconds * 100);
    },
    classNames: function() {
      return ['timer', this.player.color]
    }
  }
});

// APP
// =====

var app = new Vue({
  template: '<game />',
  el: '#app',
});

// SOUND
// =======

var explosion = new Audio('./explosion.mp3');

function initSound() {
  explosion.play();
  explosion.pause();
  explosion.currentTime = 0;
}

function playExplosion() {
  explosion.currentTime = 0;
  explosion.play();
}
