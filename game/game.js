// Star Catcher — a tiny browser game.
// One prompt: "Build me a tiny browser game where I catch falling stars."
// Move the basket with Left / Right arrows (or A / D), or drag with mouse
// and touch. Catch stars for points, miss one and lose a life. Three lives.
// Add ?demo=1 to the URL and the basket plays itself.
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');

  var W = 0;
  var H = 0;
  var demo = /[?&]demo=1/.test(location.search);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    basket.y = H - 130;
    basket.x = Math.max(20, Math.min(W - basket.w - 20, basket.x));
  }

  var basket = { x: 200, y: 600, w: 150, h: 34, speed: 14 };
  var stars = [];
  var score = 0;
  var lives = 3;
  var level = 1;
  var caught = 0;
  var over = false;
  var keys = {};
  var spawnTimer = 0;
  var frame = 0;
  var flashes = [];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnStar() {
    var size = rand(22, 40);
    stars.push({
      x: rand(size, W - size),
      y: -size,
      size: size,
      speed: rand(3.2, 5.2) + level * 0.55,
      spin: rand(-0.03, 0.03),
      angle: rand(0, Math.PI * 2),
      hue: Math.floor(rand(35, 55))
    });
  }

  function drawStar(x, y, r, angle, colour) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = colour;
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var rad = (i % 2 === 0) ? r : r * 0.45;
      var a = (Math.PI / 5) * i - Math.PI / 2;
      var px = Math.cos(a) * rad;
      var py = Math.sin(a) * rad;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBackground() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#160a33');
    g.addColorStop(0.6, '#0b0618');
    g.addColorStop(1, '#1c0b2e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (var i = 0; i < 70; i++) {
      var sx = (i * 137.5) % W;
      var sy = (i * 89.3) % H;
      ctx.globalAlpha = 0.25 + ((i % 5) * 0.12);
      ctx.fillRect(sx, sy, 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  function drawBasket() {
    ctx.fillStyle = '#c41c83';
    ctx.beginPath();
    ctx.roundRect(basket.x, basket.y, basket.w, basket.h, 12);
    ctx.fill();
    ctx.fillStyle = '#ff5db1';
    ctx.fillRect(basket.x + 8, basket.y, basket.w - 16, 8);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CATCH!', basket.x + basket.w / 2, basket.y + basket.h + 30);
  }

  function drawHud() {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('SCORE ' + score, 28, 70);
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#ffd166';
    ctx.fillText('LEVEL ' + level, 28, 115);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff5d73';
    var hearts = '';
    for (var i = 0; i < 3; i++) {
      hearts += (i < lives) ? '\u2665 ' : '\u2661 ';
    }
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(hearts, W - 28, 72);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '28px sans-serif';
    ctx.fillText(demo ? 'DEMO MODE — the agent plays itself' : 'Arrows / A D to move — catch the stars!', W / 2, H - 24);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(11,6,24,0.82)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 72px sans-serif';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 40);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('SCORE ' + score, W / 2, H / 2 + 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '30px sans-serif';
    ctx.fillText('Stars caught: ' + caught + '  •  Refresh to play again', W / 2, H / 2 + 100);
  }

  function nearestStar() {
    var best = null;
    for (var i = 0; i < stars.length; i++) {
      if (!best || stars[i].y > best.y) {
        best = stars[i];
      }
    }
    return best;
  }

  function update() {
    frame++;
    if (over) {
      return;
    }

    // Move the basket: demo mode chases the lowest star, humans use keys.
    if (demo) {
      var target = nearestStar();
      if (target) {
        var centre = basket.x + basket.w / 2;
        var dx = target.x - centre;
        var step = Math.max(-basket.speed, Math.min(basket.speed, dx));
        basket.x += step;
      }
    } else {
      if (keys.ArrowLeft || keys.KeyA) {
        basket.x -= basket.speed;
      }
      if (keys.ArrowRight || keys.KeyD) {
        basket.x += basket.speed;
      }
    }
    basket.x = Math.max(10, Math.min(W - basket.w - 10, basket.x));

    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnStar();
      spawnTimer = Math.max(18, 52 - level * 4);
    }

    for (var i = stars.length - 1; i >= 0; i--) {
      var s = stars[i];
      s.y += s.speed;
      s.angle += s.spin;
      var inBasket = s.y + s.size >= basket.y &&
        s.y <= basket.y + basket.h &&
        s.x >= basket.x - 6 &&
        s.x <= basket.x + basket.w + 6;
      if (inBasket) {
        score += 10;
        caught++;
        flashes.push({ x: s.x, y: basket.y, life: 14, text: '+10' });
        if (caught % 8 === 0) {
          level++;
        }
        stars.splice(i, 1);
      } else if (s.y - s.size > H) {
        lives--;
        stars.splice(i, 1);
        if (lives <= 0) {
          over = true;
        }
      }
    }

    for (var j = flashes.length - 1; j >= 0; j--) {
      flashes[j].life--;
      flashes[j].y -= 2;
      if (flashes[j].life <= 0) {
        flashes.splice(j, 1);
      }
    }
  }

  function draw() {
    drawBackground();
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      drawStar(s.x, s.y, s.size, s.angle, 'hsl(' + s.hue + ', 100%, 62%)');
    }
    drawBasket();
    for (var j = 0; j < flashes.length; j++) {
      var f = flashes[j];
      ctx.globalAlpha = Math.max(0, f.life / 14);
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
    drawHud();
    if (over) {
      drawGameOver();
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', function (e) {
    keys[e.code] = true;
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', function (e) {
    keys[e.code] = false;
  });
  window.addEventListener('pointermove', function (e) {
    basket.x = e.clientX - basket.w / 2;
  });
  window.addEventListener('resize', resize);

  resize();
  spawnStar();
  loop();
})();
