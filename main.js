// workaround for chrome bug: http://code.google.com/p/chromium/issues/detail?id=35980#c12
if ( window.innerWidth === 0 ) {
  window.innerWidth = parent.innerWidth; 
  window.innerHeight = parent.innerHeight; 
}

// necessary globals
var camera, scene, renderer;
var group;
var depthMaterial, depthTarget, composer;

function initRenderer() 
{
  renderer = new THREE.WebGLRenderer();
  
  // set background to white
  renderer.setClearColor(0xffffff);
  
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  camera = new THREE.PerspectiveCamera( 65, window.innerWidth / window.innerHeight, 10, 1000 );
  camera.position.z = 500;
  
}

function initScene() 
{
  scene = new THREE.Scene();

  group = new THREE.Object3D();
  scene.add( group );

  var geometry = new THREE.CubeGeometry( 10, 10, 10 );
  
  
  var texture = THREE.ImageUtils.loadTexture( "seamless-brick-texture-16810984.jpg" ); // problematic
 
  var material = new THREE.MeshBasicMaterial( { color: new THREE.Color(0.2,0.5,0.9), map: texture } );

  for ( var i = 0; i < 100; i ++ ) {

    var mesh = new THREE.Mesh( geometry, material );
    mesh.position.x = Math.random() * 400 - 200;
    mesh.position.y = Math.random() * 400 - 200;
    mesh.position.z = Math.random() * 400 - 200;
    mesh.rotation.x = Math.random();
    mesh.rotation.y = Math.random();
    mesh.rotation.z = Math.random();
    mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 10 + 1;
    group.add( mesh ); 

  }
}

function initPostProcessing() 
{
 // depth
  var depthShader = THREE.ShaderLib[ "depthRGBA" ];
  var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );

  depthMaterial = new THREE.ShaderMaterial({ 
      fragmentShader: depthShader.fragmentShader, 
      vertexShader: depthShader.vertexShader, 
      uniforms: depthUniforms 
    });
  depthMaterial.blending = THREE.NoBlending;

  // postprocessing
  composer = new THREE.EffectComposer( renderer );
  composer.addPass( new THREE.RenderPass( scene, camera ) );
  composer.addPass( initFXAA() );
  composer.addPass( initSSAO() );

}

function initFXAA() {
  dpr = 1;
  var effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
  effectFXAA.uniforms['resolution'].value.set(
    1 / (window.innerWidth * dpr), 
    1 / (window.innerHeight * dpr)
  );
  effectFXAA.renderToScreen = false;
  return effectFXAA;
}

function initSSAO() {
  depthTarget = new THREE.WebGLRenderTarget( 
    window.innerWidth, window.innerHeight, { 
      minFilter: THREE.NearestFilter, 
      magFilter: THREE.NearestFilter, 
      format: THREE.RGBAFormat 
    });

  var effect = new THREE.ShaderPass( THREE.SSAOShader );
  effect.uniforms['tDepth'].value = depthTarget;
  effect.uniforms['size'].value.set( window.innerWidth / 2, window.innerHeight / 2 );
  effect.uniforms['cameraNear'].value = camera.near;
  effect.uniforms['cameraFar'].value = camera.far;
  effect.uniforms['aoClamp'].value = 0.2;
  effect.uniforms['lumInfluence'].value = 1;
  effect.renderToScreen = true; // last one, so render
  return effect;
}

function animate() { 
  
    // limit to 60 framees per second
  setTimeout( function() {
    requestAnimationFrame( animate );
  }, 1000.0 / 60.0 );

  var t1 = performance.now();

  group.rotation.x = t1 * 0.0002;
  group.rotation.y = t1 * 0.0001;
  
  scene.overrideMaterial = depthMaterial;
  renderer.render( scene, camera, depthTarget );
  scene.overrideMaterial = null;
  composer.render();

}


function run() {
  initRenderer();
  initScene();
  initPostProcessing();
  animate();
}
