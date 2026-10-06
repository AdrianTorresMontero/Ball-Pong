

// ==========================================

// CONFIG

// ==========================================

const config = {

  type: Phaser.AUTO,

  width: 900,

  height: 600,

  parent: 'game-container',        

  backgroundColor: '#1a1a2e',

  scale: {

    mode: Phaser.Scale.FIT,        

    autoCenter: Phaser.Scale.CENTER_BOTH

  },

  physics: {

    default: 'arcade',

    arcade: {

      gravity: { y: 1200 },

      debug: false

    }

  },

  scene: {

    preload: preload,

    create: create,

    update: update

  }

};



const game = new Phaser.Game(config);



// ==========================================

// GLOBAL

// ==========================================

let jugador;

let suelo;

let paredIzq;

let paredDer;

let techo;

let teclas;

let direccion = 1;

let apuntandoArriba = false;

let musicaFondo;



let arpones;

let bolas;

let arponActivo = null;



let vidas = 3;

const VIDAS_MAX = 3;

let invulnerable = false;



let oleada = 0;

let bolasPendientes = 0;

let entreOleadas = false;

let juegoTerminado = false;

let juegoIniciado = false;



let textoVidas;

let textoOleada;

let textoMensaje;


let enMenu = true;

let pausado = false;

let textoPausa;

let teclaPausa;



const TAMANOS = {

  grande:  { radio: 50, color: 0xff4466, siguiente: 'mediana' },

  mediana: { radio: 28, color: 0xff8844, siguiente: 'pequena' },

  pequena: { radio: 14, color: 0xffdd44, siguiente: null }

};

const FRAMES = {
  arriba:    0,
  derecha:   4,
  izquierda: 8
};



// ==========================================

// PRELOAD

// ==========================================

function preload() {
  this.load.image('fondo', 'Assets/battleback1.png');
  this.load.image('jugador_frente', 'Assets/frente1.png');
  this.load.image('jugador_derecha', 'Assets/derecha5.png');
  this.load.image('jugador_izquierda', 'Assets/izquierda5.png');
  this.load.audio('musica_fondo', 'Assets/empacotatron_loop.ogg');
  


  // ============================
  // HARPON
  // ============================
  const g = this.make.graphics({ x: 0, y: 0, add: false });

  g.fillStyle(0xffcc00, 1);
  g.fillRect(0, 3, 50, 6);
  g.fillStyle(0xffee66, 1);
  g.fillTriangle(50, 0, 50, 12, 62, 6);
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(2, 4, 46, 2);
  g.generateTexture('arpon_h', 62, 12);
  g.clear();

  
  g.fillStyle(0xffcc00, 1);
  g.fillRect(3, 12, 6, 50);
  g.fillStyle(0xffee66, 1);
  g.fillTriangle(0, 12, 12, 12, 6, 0);   // punta ARRIBA
  g.fillStyle(0xffffff, 0.6);
  g.fillRect(4, 14, 2, 46);
  g.generateTexture('arpon_v', 12, 62);
  g.destroy();

}



// ==========================================

// CREATE

// ==========================================

function create() {

  const ancho = this.scale.width;

  const alto = this.scale.height;

  // --- FONDO ---
  this.add.image(ancho / 2, alto / 2, 'fondo')
  .setDisplaySize(ancho, alto);



  // RESET 

  vidas = 3;

  oleada = 0;

  bolasPendientes = 0;

  entreOleadas = false;

  juegoTerminado = false;

  juegoIniciado = false;

  invulnerable = false;

  arponActivo = null;

  direccion = 1;

  apuntandoArriba = false;

  enMenu = true;

  pausado = false;

  textoPausa = null;



  // --- SUELO ---

  suelo = this.add.rectangle(ancho / 2, alto - 30, ancho, 60, 0x0000000, 0);

  this.physics.add.existing(suelo, true);



  // --- PAREDES Y TECHO ---

  paredIzq = this.add.rectangle(-10, alto / 2, 60, alto, 0x000000, 0);

  this.physics.add.existing(paredIzq, true);



  paredDer = this.add.rectangle(ancho + 10, alto / 2, 60, alto, 0x000000, 0);

  this.physics.add.existing(paredDer, true);



  techo = this.add.rectangle(ancho / 2, -10, ancho, 60, 0x000000, 0);

  this.physics.add.existing(techo, true);



  // --- JUGADOR ---

  jugador = this.add.image(100, alto - 150, 'jugador_derecha');
  this.physics.add.existing(jugador);

  jugador.setScale(80 / 153);

  jugador.body.setCollideWorldBounds(true);
  jugador.body.setBounce(0);
  jugador.body.setDragX(1200);

  jugador.body.setSize(90, 140);
  jugador.body.setOffset(15, 13);



  this.physics.add.collider(jugador, suelo);



  // --- GRUPOS ---

  arpones = this.physics.add.group({ allowGravity: false, immovable: false });

  bolas = this.physics.add.group();



  // --- COLISIONES ---

  this.physics.add.overlap(arpones, bolas, golpearBola, null, this);

  this.physics.add.collider(bolas, suelo);

  this.physics.add.collider(bolas, paredIzq);

  this.physics.add.collider(bolas, paredDer);

  this.physics.add.collider(bolas, techo);

  this.physics.add.overlap(jugador, bolas, danoAlJugador, null, this);



  // --- CONTROLES ---

  teclas = this.input.keyboard.addKeys({

    izquierda: 'A',

    derecha: 'D',

    mirarArriba: 'W',

    salto: 'SPACE',

    disparo: 'J',

    reiniciar: 'R',

    pausa: 'P'

  });



  // --- HUD ---

  textoOleada = this.add.text(15, 15, '', {

    fontSize: '22px',

    color: '#ffffff',

    fontStyle: 'bold'

  });



  textoVidas = this.add.text(ancho - 15, 15, '', {

    fontSize: '22px',

    color: '#ff4466',

    fontStyle: 'bold'

  }).setOrigin(1, 0);



  textoMensaje = this.add.text(ancho / 2, alto / 2, '', {

    fontSize: '48px',

    color: '#ffffff',

    fontStyle: 'bold',

    align: 'center'

  }).setOrigin(0.5).setDepth(10);


  actualizarHUD();


  mostrarMenu(this);


    // --- MÚSICA DE FONDO ---
  musicaFondo = this.sound.add('musica_fondo', {
    loop: true,
    volume: 0.4
  });
  musicaFondo.play();

  this.input.once('pointerdown', () => this.sound.unlock());
  this.input.keyboard.once('keydown', () => this.sound.unlock());

  
  this.events.on('shutdown', () => {
    if (musicaFondo) {
      musicaFondo.stop();
      musicaFondo = null;
    }
  });

  
  jugador.setVisible(false);
  suelo.setVisible(false);
  textoOleada.setVisible(false);
  textoVidas.setVisible(false);

}

// --- INICIAL ---
enMenu = true;
pausado = false;

function mostrarMenu(scene) {
  const ancho = scene.scale.width;
  const alto = scene.scale.height;

  // --- TÍTULO ---
  const titulo = scene.add.text(ancho / 2, alto / 3, 'Ball Pong', {
    fontSize: '72px',
    color: '#ffffff',
    fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(20);

  // --- JUGAR ---
  const btnJugar = scene.add.text(ancho / 2, alto / 2 + 40, '[ JUGAR ]', {
    fontSize: '36px',
    color: '#00ff88',
    fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });

  // --- INSTRUCCIONES ---
  const btnInstrucciones = scene.add.text(ancho / 2, alto / 2 + 100, '[ INSTRUCCIONES ]', {
    fontSize: '24px',
    color: '#ffcc00',
    fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(20).setInteractive({ useHandCursor: true });

  // --- TEXTO DE INSTRUCCIONES  ---
  const textoInstrucciones = scene.add.text(ancho / 2, alto / 2 + 180,
    'A / D: moverte\n' +
    'W: apuntar arriba\n' +
    'ESPACIO: saltar\n' +
    'J: disparar arpon\n' +
    'P: pausa',
    {
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6
    }
  ).setOrigin(0.5).setDepth(20).setVisible(false);   // ⬅️ oculto al inicio

  // --- HOVER JUGAR ---
  btnJugar.on('pointerover', () => btnJugar.setScale(1.1));
  btnJugar.on('pointerout',  () => btnJugar.setScale(1));

  // --- HOVER INSTRUCCIONES ---
  btnInstrucciones.on('pointerover', () => btnInstrucciones.setScale(1.1));
  btnInstrucciones.on('pointerout',  () => btnInstrucciones.setScale(1));

  // --- CLICK JUGAR ---
  btnJugar.on('pointerdown', () => {
    
    titulo.destroy();
    btnJugar.destroy();
    btnInstrucciones.destroy();
    textoInstrucciones.destroy();   // ⬅️ CLAVE: destruye las instrucciones

    
    jugador.setVisible(true);
    suelo.setVisible(true);
    textoOleada.setVisible(true);
    textoVidas.setVisible(true);

    enMenu = false;
    scene.time.delayedCall(300, () => siguienteOleada(scene));
  });

  // --- CLICK INSTRUCCIONES (toggle) ---
  btnInstrucciones.on('pointerdown', () => {
    textoInstrucciones.setVisible(!textoInstrucciones.visible);
  });
}

// ==========================================

// FUNCTION WAVES

// ==========================================

function siguienteOleada(scene) {

  if (juegoTerminado) return;



  oleada++;

  juegoIniciado= true;

  actualizarHUD();



  textoMensaje.setText(`OLEADA ${oleada}`);

  textoMensaje.setAlpha(1);



  scene.tweens.add({

    targets: textoMensaje,

    alpha: 0,

    duration: 1200,

    delay: 500

  });



  const cantidadGrandes = 1 + oleada;

  bolasPendientes = cantidadGrandes;

  entreOleadas = false;



  for (let i = 0; i < cantidadGrandes; i++) {

    scene.time.delayedCall(500 + i * 400, () => {

      if (juegoTerminado) return;

      const x = Phaser.Math.Between(120, scene.scale.width - 120);

      crearBola(scene, 'grande', x, -60);

      bolasPendientes--;

    });

  }

}





function crearBola(scene, tamano, x, y) {

  const datos = TAMANOS[tamano];



  const bola = scene.add.circle(x, y, datos.radio, datos.color);

  scene.physics.add.existing(bola);



  bola.tamano = tamano;



  bola.body.setBounce(1);

  bola.body.setDrag(0);

  bola.body.setCollideWorldBounds(false);



  bola.body.setVelocity(

    Phaser.Math.Between(-150, 150),

    0

  );



  bolas.add(bola);

  bola.body.setBounce(1);



  return bola;

}



// ==========================================

// COLISION

// ==========================================

function golpearBola(arpon, bola) {

  if (!arpon.active || !bola.active) return;

  if (juegoTerminado) return;



  const escena = arpon.scene;



  const tamanoActual = bola.tamano;

  const datos = TAMANOS[tamanoActual];

  const x = bola.x;

  const y = bola.y;



  if (arponActivo === arpon) arponActivo = null;



  arpon.destroy();

  bola.destroy();



  if (datos.siguiente) {

    

    const hijaIzq = crearBola(escena, datos.siguiente, x - 20, y);

    const hijaDer = crearBola(escena, datos.siguiente, x + 20, y);



    

    hijaIzq.body.setVelocityX(-350);

    hijaDer.body.setVelocityX(350);



    

    

    const impulsoArriba = -500;

    hijaIzq.body.setVelocityY(impulsoArriba);

    hijaDer.body.setVelocityY(impulsoArriba);

  }

}



// ==========================================

// FUNCIÓN: daño al jugador

// ==========================================

function danoAlJugador(jugadorObj, bola) {

  if (juegoTerminado) return;

  if (invulnerable) return;

  if (!bola.active) return;



  vidas--;

  actualizarHUD();



  invulnerable = true;

  jugadorObj.scene.tweens.add({

    targets: jugadorObj,

    alpha: 0.2,

    duration: 100,

    yoyo: true,

    repeat: 8,

    onComplete: () => {

      jugadorObj.setAlpha(1);

      invulnerable = false;

    }

  });



  if (vidas <= 0) {

    gameOver(jugadorObj.scene);

  }

}



// ==========================================

// FUNCIÓN: disparar

// ==========================================

function disparar(scene) {
  if (arponActivo) return;
  if (juegoTerminado) return;

  const VELOCIDAD_ARPON = 800;

  let arpon;
  let velX = 0;
  let velY = 0;

  if (apuntandoArriba) {
    // --- ARPÓN VERTICAL ---
    arpon = scene.add.image(jugador.x, jugador.y - 40, 'arpon_v');
    velY = -VELOCIDAD_ARPON;

    arpones.add(arpon);
    arpon.body.setAllowGravity(false);
    arpon.body.setSize(12, 62);
    arpon.body.setOffset(0, 0);
    arpon.body.setVelocity(0, velY);

  } else {
    // --- ARPÓN HORIZONTAL ---
    arpon = scene.add.image(
      jugador.x + direccion * 40,
      jugador.y,
      'arpon_h'
    );
    if (direccion === -1) arpon.setFlipX(true);
    velX = VELOCIDAD_ARPON * direccion;

    arpones.add(arpon);
    arpon.body.setAllowGravity(false);
    arpon.body.setSize(62, 12);
    arpon.body.setOffset(0, 0);
    arpon.body.setVelocity(velX, velY);
  }

  arponActivo = arpon;
}



function actualizarHUD() {

  textoOleada.setText(`OLEADA ${oleada}`);

  let corazones = '';

  for (let i = 0; i < VIDAS_MAX; i++) {

    corazones += (i < vidas) ? '❤' : '♡';

  }

  textoVidas.setText(corazones);

}



// ==========================================

// game over

// ==========================================

function gameOver(scene) {

  juegoTerminado = true;

  juegoIniciado = false;

  if (musicaFondo) musicaFondo.pause();

  bolas.clear(true, true);

  arpones.clear(true, true);

  arponActivo = null;



  textoMensaje.setText(`GAME OVER\n\nOleada alcanzada: ${oleada}\n\nPulsa R para reiniciar`);

  textoMensaje.setAlpha(1);

}



// ==========================================

// UPDATE

// ==========================================

function update(tiempo, delta) {

  const escena = this;



  if (juegoTerminado) {

    if (Phaser.Input.Keyboard.JustDown(teclas.reiniciar)) {

      escena.scene.restart();

    }

    return;

  }

  if (enMenu) return;

  // --- PAUSA CON P ---
  if (Phaser.Input.Keyboard.JustDown(teclas.pausa)) {
    pausado = !pausado;

    if (pausado) {
      // Congelar
      this.physics.pause();

      // Overlay oscuro
      textoPausa = escena.add.rectangle(
        escena.scale.width / 2,
        escena.scale.height / 2,
        escena.scale.width,
        escena.scale.height,
        0x000000, 0.6
      ).setDepth(30);

      const txtPausa = escena.add.text(
        escena.scale.width / 2,
        escena.scale.height / 2,
        'PAUSA\n\nPulsa P para continuar',
        {
          fontSize: '48px',
          color: '#ffffff',
          fontStyle: 'bold',
          align: 'center'
        }
      ).setOrigin(0.5).setDepth(31).setName('txtPausa');
    } else {
      // Reanudar
      this.physics.resume();
      if (textoPausa) textoPausa.destroy();
      const txt = escena.children.getByName('txtPausa');
      if (txt) txt.destroy();
    }
  }

  if (pausado || enMenu) return;

  if (!enMenu && juegoIniciado && !entreOleadas && bolasPendientes === 0 && bolas.countActive(true) === 0) {

    entreOleadas = true;



    textoMensaje.setText('¡OLEADA SUPERADA!');

    textoMensaje.setAlpha(1);

    escena.tweens.add({

      targets: textoMensaje,

      alpha: 0,

      duration: 800,

      delay: 700

    });



    escena.time.delayedCall(1800, () => {

      if (!juegoTerminado) siguienteOleada(escena);

    });

  }

  const velocidad = 260;

  const fuerzaSalto = -650;



  if (teclas.izquierda.isDown) {

    jugador.body.setVelocityX(-velocidad);

    direccion = -1;

  } else if (teclas.derecha.isDown) {

    jugador.body.setVelocityX(velocidad);

    direccion = 1;

  }



  apuntandoArriba = teclas.mirarArriba.isDown;

  // --- Cambiar posicion ---
  if (apuntandoArriba) {
    jugador.setTexture('jugador_frente');
  } else if (direccion === -1) {
    jugador.setTexture('jugador_izquierda');
  } else {
    jugador.setTexture('jugador_derecha');
  }



  const enSuelo = jugador.body.blocked.down;

  if (teclas.salto.isDown && enSuelo) {

    jugador.body.setVelocityY(fuerzaSalto);

  }



  if (Phaser.Input.Keyboard.JustDown(teclas.disparo)) {

    disparar(escena);

  }



  if (arponActivo && arponActivo.active) {

    const a = arponActivo;

    if (a.x < -80 || a.x > escena.scale.width + 80 ||

        a.y < -80 || a.y > escena.scale.height + 80) {

      a.destroy();

      arponActivo = null;

    }

  }



  bolas.children.each((bola) => {

    if (!bola.active) return;

    if (bola.y > escena.scale.height + 300) bola.destroy();

  });


}