$(document).ready(function() {

    // nav and header event handlers
    $('nav.menu').on('click', 'a', function() {
        $('a').removeClass('active');
        $(this).addClass('active');
    });
    $('header').on('click', 'a.menu', function() {
        $(this).toggleClass('active');
        $('.drop-nav').toggleClass('active');
    });
    $('h1.logo').hover(

        function() {
            $('.lightning').css('display', 'block');
            $('.storm').css('display', 'none');
        },
        function() {
            $('.lightning').css('display', 'none');
            $('.storm').css('display', 'block');
        });

    //Local Storage for persistence of high scores
    var storage = {
        set: function(highScore) {
            localStorage.setItem('score', JSON.stringify(highScore));
        },
        get: function() {
            var score = localStorage.score === undefined ? false :
                localStorage.score;
            return JSON.parse(score);
        }
    };

    (function() {
        var storedScore = storage.get();
        console.log(storedScore);
        if (storedScore > 20000) {
            $('.high-score span').text(storedScore);
        }
    })();

    //GLOBAL VARIABLES
    var allRaindrops = [];
    //this is the interval between the creation of new drops
    var interval = 4000;
    //this is the rate by which interval is decreased when each drop is made
    var frequencyIncrease = 100;
    //this is the amount of time(ms) that it takes a drop to reach the bottom when the game begins
    var rainSpeed = 16000;
    //this is the amount of time(ms) which elapse before the fall speed increases
    var increaseSpeedInterval = 25000;
    var gameDuration = null;
    var currentGameScore = 0;
    var raindropSound = new Audio('./audio/WaterDrop.mp3');
    var thunderSound = new Audio('./audio/Thunder.mp3');
    var thunderInterval = null;

    //Start Game button
    $('.start-game').on('click', function() {
        makeItRain();
    });

    //Solution-field
    $('form').on('keypress', '.solution-field', function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            var userSolution = $(this).val();
            checkAnswers(userSolution);
            $(this).val('');
        }
    });

    //Game FUNCTIONS
    function makeItRain() {
        $('.current-score span').text("0");
        bringInClouds();
        $('.start-game').hide();
        new Raindrop();
        setFocus();
        hideCursor();
        runGame();
        setRainSpeed();
        thunderClap();
    }

    function thunderClap() {
        thunderInterval = setInterval(function() {
            thunderSound.play();
        }, 90000);
    }

    function bringInClouds() {
        $('#rainy-background').css({
            'transition': 'opacity 60s ease-in'
        });
        $('img').addClass('active');
        $('.game').addClass('active');
        $('header').addClass('active');
    }

    function hideCursor() {
        $('html').css({
            cursor: 'none'
        });
        setTimeout(function() {
            $('html').mousemove(function() {
                $('html').css({
                    cursor: 'auto'
                });
            });
        }, 300);
    }

    function setFocus() {
        var input = $('.solution-field');
        input.attr("readonly", false);
        input.focus();
    }

    function runGame() {
        gameDuration = setInterval(function() {
            if (checkAnswers) {
                new Raindrop();
                interval -= frequencyIncrease;
            }
        }, interval);
    }

    function setRainSpeed() {
        setInterval(function() {
            rainSpeed -= 500;
            return rainSpeed;
        }, increaseSpeedInterval);
    }

    function endGame() {
        $('.raindrop').stop().remove();
        $('.solution-field').attr("readonly", true);
        clearInterval(gameDuration);
        clearInterval(thunderInterval);
        alert("GAME OVER");
        reset();
        removeClouds();
        $('.start-game').show().val('Play Again');
    }

    function reset() {
        allRaindrops = [];
        interval = 4000;
        gameDuration = null;
        currentGameScore = 0;
        rainSpeed = 16000;
    }

    function removeClouds() {
        $('img').removeClass('active');
        $('.game').removeClass('active');
        $('header').removeClass('active');
        $('#rainy-background').css({
            'transition': 'none',
            'opacity': 0
        });
    }

    function checkAnswers(userSolution) {
        if (!userSolution) {
            return true;
        }
        var numSolution = Number(userSolution);
        var correctOperators = [];
        for (var index = allRaindrops.length - 1; index >= 0; index--) {
            var drop = allRaindrops[index];
            if (drop.values.solution === numSolution) {
                allRaindrops.splice(index, 1);
                drop.self.remove().stop();
                raindropSound.play();
                correctOperators.push(drop.values.operator);
            }
        }
        scoreSolution(correctOperators);
        userSolution = null;
        numSolution = null;
    }

    function scoreSolution(operators) {
        var scoreValue = 0;
        var multiplier = operators.length;
        if (operators.length === 0) {
            scoreValue = "INCORRECT!";
        } else {
            for (var index = 0; index < operators.length; index++) {
                switch (operators[index]) {
                    case "+":
                        scoreValue += 1000 * multiplier;
                        break;
                    case "-":
                        scoreValue += 1500 * multiplier;
                        break;
                    case "*":
                        scoreValue += 2000 * multiplier;
                        break;
                    case "/":
                        scoreValue += 2500 * multiplier;
                        break;
                    default:
                        alert("Something went wrong");
                        break;
                }
            }
        }
        postScore(scoreValue, multiplier);
    }

    function postScore(scoreValue, multiplier) {
        var currentHighScore = parseInt($('.high-score span').text());
        if (scoreValue === "INCORRECT!") {
            $('.solution-score').text(scoreValue).css('color', 'red');
        } else {
            $('.solution-score').html("CORRECT! :" + "<br>" + "+" + scoreValue).css('color', 'white');
            currentGameScore += scoreValue;
            $('.current-score span').text(currentGameScore);
            $('.multiplier span').text('X' + multiplier);
            if (currentGameScore > currentHighScore) {
                $('.high-score span').text(currentGameScore);
                storage.set(currentGameScore);
            }
        }
    }

    //CONTRUCTORS
    function Raindrop() {
        this.values = {
            firstNumber: null,
            secondNumber: null,
            operator: null,
            solution: null
        };

        this.init = function() {
            this.generateProblem();
            this.self = this.createRaindrop();
            this.rainFall(this.self, rainSpeed);
            allRaindrops.push(this);
        };
        this.init();
    }

    //PROTOTYPES
    Raindrop.prototype = {
        generateOperator: function() {
            var operator = "";
            var operNumber = Math.ceil(Math.random() * 4);
            if (operNumber === 1) {
                operator = "+";
            } else if (operNumber === 2) {
                operator = "-";
            } else if (operNumber === 3) {
                operator = "*";
            } else {
                operator = "/";
            }
            this.values.operator = operator;
            return operator;
        },

        generateNumbers: function(operator) {
            if (operator === "+" || operator === "-") {
                this.genNumAddSub();
            } else if (operator === "*") {
                this.genNumMultiply();
            } else {
                this.genNumDivide();
            }
        },

        genNumAddSub: function() {
            var operand1 = Math.ceil(Math.random() * 20),
                operand2 = Math.ceil(Math.random() * 15);
            this.values.firstNumber = operand1;
            this.values.secondNumber = operand2;
        },

        genNumMultiply: function() {
            var operand = Math.ceil(Math.random() * 15),
                multiplier = Math.ceil(Math.random() * 10);
            this.values.firstNumber = operand;
            this.values.secondNumber = multiplier;
        },

        genNumDivide: function() {
            var divider = Math.ceil(Math.random() * 12);
            var operand = (Math.ceil(Math.random() * 13)) * divider;
            this.values.firstNumber = operand;
            this.values.secondNumber = divider;
        },

        generateProblem: function() {
            this.generateNumbers(this.generateOperator());
            var solution = null,
                operator = this.values.operator,
                firstNumber = this.values.firstNumber,
                secondNumber = this.values.secondNumber;
            switch (operator) {
                case "+":
                    solution = firstNumber + secondNumber;
                    break;
                case "-":
                    solution = firstNumber - secondNumber;
                    break;
                case "*":
                    solution = firstNumber * secondNumber;
                    break;
                default:
                    solution = firstNumber / secondNumber;
            }
            this.values.solution = solution;
        },

        createRaindrop: function() {
            var posLeft = Math.ceil(Math.random() * 69 + 13);
            $('.game-container').prepend($('<div/>').addClass('raindrop').css({
                'left': posLeft + '%'
            }).text(this.values.firstNumber + this.values.operator + this.values.secondNumber));
            return $('.raindrop').first();
        },

        rainFall: function(drop, rainSpeed) {
            $(drop).animate({
                "top": "85.5%"
            }, rainSpeed, function() {
                endGame();
            });
        }
    };
});
