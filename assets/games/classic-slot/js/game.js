var phaser;
//noinspection JSUnusedGlobalSymbols
var game = {
    init: function (id, width, height) {
        phaser = new Phaser.Game(width, height, Phaser.AUTO, id, {
            preload: preload,
            create: create,
            update: update,
            render: render
        })
    }
};

function preload() {
    phaser.load.image('bg', '/assets/games/classic-slot/images/bg.png');
    phaser.load.image('fg', '/assets/games/classic-slot/images/fg.png');
    phaser.load.image('coin', '/assets/games/classic-slot/images/coin.png');
    phaser.load.spritesheet('symbols', '/assets/games/classic-slot/images/symbols.png', 420 / 3, 420 / 3, 9);
    phaser.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    phaser.scale.setScreenSize();
}

var sprites = [];
var reels = [
    [],
    [],
    []
];
var geo = [];
var stops = [0, 0, 0];
var targetStops = [-1, -1, -1];

function create() {

    phaser.add.image(phaser.world.centerX, phaser.world.centerY, 'bg').anchor.set(0.5);

    geo = [{
        x: phaser.world.centerX - 170,
        y: phaser.world.centerY
    },
        {
            x: phaser.world.centerX,
            y: phaser.world.centerY
        },
        {
            x: phaser.world.centerX + 170,
            y: phaser.world.centerY
        }
    ];

    core.get(
        "/api/games/classic-slot",
        function (data) {
            targetStops = data.stops;
            reels = data.reels;
            for (var reelIndex = 0; reelIndex < data.reels.length; reelIndex++) {
                var reel = reels[reelIndex];
                for (var stop = 0; stop < reel.length; stop++) {
                    var sprite = phaser.add.sprite(geo[reelIndex].x, geo[reelIndex].y, 'symbols');
                    sprite.anchor.set(0.5);
                    sprite.frame = reel[stop];
                    sprite.reelIndex = reelIndex;
                    sprite.stop = stop;
                    sprite.reposition = function () {
                        this.y = geo[this.reelIndex].y + (this.stop - stops[this.reelIndex]) % reels[this.reelIndex].length * 130;
                    };
                    sprite.reposition();
                    sprites.push(sprite);
                }
            }
            phaser.add.image(phaser.world.centerX, phaser.world.centerY, 'fg').anchor.set(0.5)
        });

    core.addButton("Spin!", spin);
}
var spinStart;

function spin() {
    spinStart = new Date();
    targetStops = [-1, -1, -1];
    core.post("/api/games/classic-slot/spins",
        {
            amount: core.coin
        },
        function (data) {
            setTimeout(function () {
                    targetStops = data.stops
                },
                Math.min(3000, new Date().getTime() - spinStart.getTime()));

            var win = (data.balance - core.getBalance()) > 0;

            if (win) {
                $.each(geo, function (i, point) {

                    var emitter = phaser.add.emitter(0, 0, 100);
                    emitter.makeParticles('coin');
                    emitter.gravity = 1000;

                    emitter.x = point.x;
                    emitter.y = point.y;
                    emitter.start(true, 1000, null, 5);
                });
            }

            core.setBalance(data.balance);
        }
    );
}

function update() {
    for (var i = 0; i < stops.length; i++) {
        if (reels[i].length > 0 && targetStops[i] !== stops[i]) {
            stops[i] = (stops[i] + 1) % reels[i].length;
            if (targetStops[i] !== stops[i]) {
                break;
            }
        }
    }
    $.each(sprites, function (i, sprite) {
        sprite.reposition();
    });
}

function render() {
    // phaser.debug.cameraInfo(phaser.camera, 32, 32);
}

var s = document.createElement("script");
s.setAttribute("src", "/assets/games/classic-slot/js/phaser.min.js");
document.getElementsByTagName("head")[0].appendChild(s);