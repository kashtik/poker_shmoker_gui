/* CSRF token */
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

csrf =  getCookie('csrftoken');

/* Creating a deck */
function Deck() {
	var nominals = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"],
		types = ["c", "d", "h", "s"],
		self = this;

	this.cards_const = [];
	nominals.map(function(a){
		types.map(function(b){
			self.cards_const.push(a+b);
		})
	})
	
	/* from stack overflow - https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array */
	function shuffle(a) {
		var j, x, i;
		for (i = a.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = a[i];
			a[i] = a[j];
			a[j] = x;
		}
		return a;
	}
	
	this.cards = [];
	
	this.shuffle = function(){
		self.cards = self.cards_const;
		shuffle(self.cards);
	};
	
	this.draw = function(){
		return self.cards.pop();
	};
};


/* Registering the table with pot and cards */

Vue.component("poker-table", {
	props:["pot", "cards"],
	template:'<div class="poker_table" >'+
				'<div id="pot" v-show="(pot!=0)" style="font-size:25px; padding-left:80px" class="money" >Pot: ${{pot}}</div>'+
				'<div id="board" ><img class="card" v-for="card in cards" :src="\'/static/images/\'+card+\'.png\'" ></img></div>'+
			'</div>'
})


/* Registering player area to deal cards, display stack, etc etc */

Vue.component('player', {
	props: ["id", 'stack', "bet", "cards", "turn", "button", "display", "top", "left", "bet_top", "bet_left"],
	template: 
			'<div v-show="display" class="player_info" :style="{top:top, left:left, opacity:turnOpacity()}" >'+
				'<div class="player_cards" >'+
					'<img class="card" v-for="card in cards" :src="\'/static/images/\'+(id==0?card+\'.png\':\'card_back.jpg\')" ></img>'+
				'</div>'+
				'<p class="player_stack money" >${{stack}}</p>'+
				'<div class="button" v-show="button" style="position:absolute;right:0px;bottom:10px" ><img src="/static/images/dealer_button.jpg" style="height:30px; width:30px" ></img></div>'+
				'<div class="money" v-show="(bet!=0)" :style="{top:bet_top, left:bet_left, position:\'absolute\'}" >{{bet}}</div>'+
			'</div>',
	methods:{
		turnOpacity:function(){
			console.log(this.turn);
			if (this.turn){
				return "1";
			}else{
				return "0.5";
			}
		}
	}
})


/* Main App */

var app = new Vue({
	el: '#app',
	data: {
		numPlayers:"",
		participants:[1,1,1,1,1,1,1,1,1],
		smBlind:10,
		bgBlind:20,
		bettingRound:0,
		players:[
			{id:0, stack:15000, bet:0, cards:[], turn:false, button:false, display:true, position:{ top:"387px", left:"211px" }, bet_position:{top:"-20px", left:"50px"}},
			{id:1, stack:15000, bet:0, cards:[], turn:false, button:false, display:true, position:{ top:"206px", left:"10px" }, bet_position:{top:"63px", left:"107px"}},
			{id:2, stack:15000, bet:0, cards:[], turn:false, button:false, display:true, position:{ top:"21px", left:"159px" }, bet_position:{top:"155px", left:"50px"}},
			{id:3, stack:15000, bet:0, cards:[], turn:false, button:false, display:true, position:{ top:"4px", left:"366px" }, bet_position:{top:"138px", left:"10px"}},
			{id:4, stack:15000, bet:0, cards:[], turn:false, button:false, display:true, position:{ top:"4px", left:"588px" }, bet_position:{top:"150px", left:"-30px"}},
			{id:5, stack:15000, bet:0, cards:[], turn:false, button:false, display:true, position:{ top:"121px", left:"772px" }, bet_position:{top:"112px", left:"-79px"}},
			{id:6, stack:15000, bet:0, cards:[], turn:false, button:false, display:true, position:{ top:"310px", left:"752px" }, bet_position:{top:"23px", left:"-82px"}},
			{id:7, stack:15000, bet:0, cards:[], turn:false, button:false, display:true, position:{ top:"389px", left:"608px" }, bet_position:{top:"-20px", left:"-20px"}},
			{id:8, stack:15000, bet:0, cards:[], turn:false, button:false, display:true, position:{ top:"389px", left:"423px" }, bet_position:{top:"-20px", left:"10px"}}
		],
		table:{ pot:0, cards:[] },
		deck:new Deck(),
		gameState:[],
		pTurn:false,
		pBet:0
	},
	methods:{
        resetParticipants:function(){
            switch( this.numPlayers ){
				case "2":
					this.participants = [1,0,0,0,1,0,0,0,0];
					break;
				case "6":
					this.participants = [1,1,1,0,1,1,1,0,0];
					break
				case "9":
					this.participants = [1,1,1,1,1,1,1,1,1];
					break
			}
        },
		newGame:function(){
			this.resetParticipants();
            
			var self = this;
			this.players.map(function(x, ind){ 
				if (self.participants[ind]) {
					x.display = true;
				}else{
					x.display = false;
				}
			});
			this.newHand();
		},
		newHand:function(){
            this.resetParticipants();
            
			// getting button or setting new one;
			var buttonPos = this.getButton(),
				self = this;
			
			if (buttonPos < 0){
				this.setButton(0); // Default to 0 player in new game
				buttonPos = 0;
			}else{
				this.setButton(this.nextPlayerAfter(buttonPos));
				buttonPos = this.getButton();
			}
			
            // Clearing pot and board, bets;
            this.table.pot = 0;
            this.table.cards = [];
            this.players.map(function(x){
                x.bet = 0;
            })
			
			// Dealing cards:
			this.deck.shuffle();
			
			this.participants.map(function(x, ind){
				if (x==1){
					self.players[ind].cards = [self.deck.draw(), self.deck.draw()];
				}
			})
			
			
			// Setting small/big blinds:
			var smBlindPos,
				bgBlindPos;
				
			if (this.numPlayers == 2){
				smBlindPos = buttonPos;
			}else{
				smBlindPos = this.nextPlayerAfter(buttonPos);
			}
			this.playerBet(smBlindPos, this.smBlind);
			
			bgBlindPos = this.nextPlayerAfter(smBlindPos);
			this.playerBet(bgBlindPos, this.bgBlind);
			
			
			// starting to create gameState:
            
			this.gameState = [["button_pos", buttonPos]];
			this.gameState.push(this.participants.slice());
			this.gameState.push([smBlindPos, "player", "bets", this.smBlind]);
			this.gameState.push([bgBlindPos, "player", "bets", this.bgBlind]);
			
			// Betting round preflop
			this.bettingRound = 0;
			
			// Setting turn:
			this.turn(this.nextPlayerAfter(bgBlindPos));
		},
		nextBettingRound:function(){
			// Deal the flop, turn, river
			if( this.bettingRound == 1 ){
				// Flop
				this.table.cards.push(this.deck.draw());
				this.table.cards.push(this.deck.draw());
				this.table.cards.push(this.deck.draw());
			}else if ( this.bettingRound == 2 ){
				// Turn
				this.table.cards.push(this.deck.draw());
			}else if ( this.bettingRound == 3 ){
				// River
				this.table.cards.push(this.deck.draw());
			}else if ( this.bettingRound == 4 ){
				this.showDown();
				return;
			}
			
			this.gameState.push(["board", this.table.cards]);
			
			// Consolidate bets
			var self = this;
			this.players.map(function(x){
				self.table.pot += x.bet;
				x.bet = 0;
			})
			
			// Next turn
			var bgBlindPos = this.gameState[3][0];
			this.turn(this.nextPlayerAfter(bgBlindPos));
		},
        showDown:function(){
            var self=this;
            
            $.ajax({
                url:"/poker-playbox/compare-scores",
                type:"POST",
                data:{
                    csrfmiddlewaretoken:csrf,
                    board:JSON.stringify(self.table.cards),
                    player_hands:JSON.stringify(self.players.map(function(x){ return x.cards; }))
                },
                success:function(response){
                    var indScores = JSON.parse(response).map(function(x, index){
                        return [index, x];
                    });
                    
                    var maxScore = Math.max.apply(null, indScores.map(function(x){ return x[1] }) );
                    
                    var winners = indScores.filter(function(x){ return x[1] == maxScore });
                    
                    self.declareWinner( winners.map(function(x){ return x[0] }) );
                }
            })
        },
		declareWinner:function(ind){
			var self=this;
			
			if ( typeof ind == "number"){
				// Means index ind wins this round so we collect bling bling
				alert("Player "+ind+" wins this round!");
				
                console.log(self.table.pot, self.players, self.table.pot, self.players.reduce(function(total, x){
					return Number(total) + Number(x.bet);
				}))
                
				self.players[ind].stack += Number(self.table.pot) + self.players.reduce(function(total, x){
					return Number(total) + Number(x.bet);
				}, 0);
				
				self.newHand();
            }else if( typeof ind == "object" ){
                // Means we split the winnings
                alert("Players "+ind+" split the winnings");
                
                var totalWinnings = Number(self.table.pot) + self.players.reduce(function(total, x){
					return Number(total) + Number(x.bet);
				}, 0);
                
                var pieceOfPie = totalWinnings/ind.length;
                
                ind.map(function(x){
                    self.players[x].stack += pieceOfPie
                });
                
                self.newHand();
                
			}
		},
		turn:function(ind){
			this.players[ind].turn = true;
			if (ind == 0){
				this.pTurn = true;
				return;
			}
			this.botTurn(ind);
		},
		
		/* Bot turn */
		botTurn:function(ind){
			var self=this;
            
			$.ajax({
				url:"/poker_shmoker_ajax/",
				type:"POST",
				data:{
					csrfmiddlewaretoken:csrf,
					hero_hand:JSON.stringify(self.players[ind].cards),
					game_state_history:JSON.stringify(self.gameState)
				},
				success:function(response){
					self.completeTurn(ind, JSON.parse(response));
					// Parse response to get the action and send it to bot turn done
				}
			})
		},
		
		/* Handling player turn */
		playerTurn:function(action){
			// Hide buttons again
			this.pTurn = false;
			
			// Getting all current bets on the table
			var bets = []
			this.players.map(function(x){
				bets.push(x.bet);
			})
            
            if ( action == "fold" || action == "check" ){
                this.completeTurn(0, [action, 0]);
                return;
                
            }else if ( action == "call" ){
                this.completeTurn(0, ["call", Math.max.apply(null, bets)]);
                return;
                
            }else if ( action == "bet" || action == "raise" ){
                this.completeTurn(0, [action, Number(this.pBet)]);
                return;
            }
			
			alert("Something wrong with action! Try again!");
			
			this.turn(0);
		},
		
		// Completing the turn with data and checking if time for new round
		completeTurn(ind, actionAr){
			
			this.players[ind].turn = false;
			
			var action = actionAr[0],
				bet = actionAr[1];
				
			if (action=="fold"){
				this.participants[ind] = 0;
				this.players[ind].cards = [];
			}
			if (action=="call" || action=="check"){
				this.playerBet(ind, bet);
			}
			if (action=="bet" || action=="raise"){
				this.playerBet(ind, bet)
			}
			
			if (this.totalParticipants() <= 1){
                // Means everyone folded so we need to find the remaining player and declare winner
                
				this.declareWinner(this.participants.indexOf(1));
				return;
			}
			
			this.gameState.push([ind, "player", action, bet]);
			
			if (this.allBetsEqual() && this.everyoneHadTurn() ){
				this.bettingRound += 1
				this.nextBettingRound();
                return;
			}
			
            this.turn(this.nextPlayerAfter(ind));
		},
		
		/* Helper functions from now on */
		getButton:function(){
			var b = -1;
			this.players.map(function(x, ind){
				if (x.button){
					b = ind;
				}
			})
			return b;
		},
		setButton:function(ind){
			this.players.map(function(x){
				x.button = false;
			})
			this.players[ind].button = true;
		},
		playerBet:function(ind, amnt){
			var actualBet = Math.min( amnt, this.players[ind].stack );
			
			this.players[ind].bet = actualBet;
			this.players[ind].stack -= actualBet;
		},
		nextPlayerAfter:function(ind){
			var j = -1,
				i = ind;
			while (j < 0){
				i = (i+1)%this.participants.length;
				if (this.participants[i] == 1){
					j = i;
				}
			}
			return j;
		},
		totalParticipants:function(){
			var sum = 0 ;
			this.participants.map(function(x){
				sum+=x;
			})
			return sum;
		},
		allBetsEqual:function(){
			var b = -1,
				self = this;
			
			for ( var i=0; i<self.participants.length; i++ ){
				if ( self.participants[i] == 1 ){
					if ( b < 0 ){
						b = self.players[i].bet;
					}else{
						if ( b != self.players[i].bet ){
							return false;
						}
					}
				}
			}
			
			return true;
		},
		everyoneHadTurn:function(){
			var actions=[],
				reversedGameState = this.gameState.slice().reverse();
				
			if (this.bettingRound == 0){
				actions = reversedGameState.slice(0, reversedGameState.length-4);
			}else{
				actions = reversedGameState.slice(0, reversedGameState.findIndex(function(x, ind){
					if (x[0] == "board"){
						return true;
					}
				}))
			}
			
			var finishedTurnsIds = actions.map(function(x){ return x[0] });
			
			for ( var i=0; i<this.participants.length; i++ ){
				if ( this.participants[i] == 1 ){
					if ( finishedTurnsIds.indexOf(i) < 0 ){
						return false;
					}
				}
			}
			
			return true;
		}
	}
})

