var orbitControls;
	var container, camera, scene, renderer, loader;
	var gltf, background, envMap, mixer, gui, extensionControls;
	var object;

	var clock = new THREE.Clock();

	var scenes = {
		Statue: {
			name: 'Statue',
			url: './models/gltf/Statue/%s/scene.gltf',
			author: 'Spogna',
			authorURL: 'https://sketchfab.com/spogna',
			cameraPos: new THREE.Vector3( 0.1, 8.1, 3 ),
			objectRotation: new THREE.Euler( 0, Math.PI, 0 ),
			extensions: [ 'glTF'],
			addEnvMap: true
		}
	};

	var state = {
		scene: Object.keys( scenes )[ 0 ],
		extension: scenes[ Object.keys( scenes )[ 0 ] ].extensions[ 0 ],
		playAnimation: true
	};			
	

	function onload() {

		container = document.getElementById( 'container' );

		renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.gammaOutput = true;
		renderer.physicallyCorrectLights = true;
		container.appendChild( renderer.domElement );

		window.addEventListener( 'resize', onWindowResize, false );

		// Load background and generate envMap

		var loader = new THREE.RGBELoader();
		loader.load( 'mutianyu_4k.hdr', function ( texture ) {

			texture.encoding = THREE.RGBEEncoding;
			texture.minFilter = THREE.NearestFilter;
			texture.magFilter = THREE.NearestFilter;
			texture.flipY = true;

			var cubeGenerator = new THREE.EquirectangularToCubeGenerator( texture, { resolution: 1024 } );
			cubeGenerator.update( renderer );

			background = cubeGenerator.renderTarget;

			var pmremGenerator = new THREE.PMREMGenerator( cubeGenerator.renderTarget.texture );
			pmremGenerator.update( renderer );

			var pmremCubeUVPacker = new THREE.PMREMCubeUVPacker( pmremGenerator.cubeLods );
			pmremCubeUVPacker.update( renderer );

			envMap = pmremCubeUVPacker.CubeUVRenderTarget.texture;

			pmremGenerator.dispose();
			pmremCubeUVPacker.dispose();

			initScene( scenes[ state.scene ] );
			animate();

		} );

	}

	function initScene( sceneInfo ) {

		scene = new THREE.Scene();
		scene.background = new THREE.Color( 0x222222 );

		camera = new THREE.PerspectiveCamera( 45, container.offsetWidth / container.offsetHeight, 0.001, 1000 );
		scene.add( camera );

		// TODO: Reuse existing OrbitControls, GLTFLoaders, and so on

		orbitControls = new THREE.OrbitControls( camera, renderer.domElement );
		orbitControls.noZoom = true;
		orbitControls.noKeys = true;
		loader = new THREE.GLTFLoader();

		THREE.DRACOLoader.setDecoderPath( 'js/libs/draco/gltf/' );
		loader.setDRACOLoader( new THREE.DRACOLoader() );

		var url = sceneInfo.url.replace( /%s/g, state.extension );
		if ( state.extension === 'glTF-Binary' ) {

			url = url.replace( '.gltf', '.glb' );

		}

		var loadStartTime = performance.now();

		loader.load( url, function ( data ) {

			gltf = data;

			object = gltf.scene;

			console.info( 'Load time: ' + ( performance.now() - loadStartTime ).toFixed( 2 ) + ' ms.' );

			if ( sceneInfo.cameraPos ) {

				camera.position.copy( sceneInfo.cameraPos );
				camera.position.y = 3;
				
			}
			
			//tem q por se nao fica tudo preto
			if ( sceneInfo.addEnvMap ) {

				object.traverse( function ( node ) {

					if ( node.material && ( node.material.isMeshStandardMaterial ||
						 ( node.material.isShaderMaterial && node.material.envMap !== undefined ) ) ) {

						node.material.envMap = envMap;
						node.material.envMapIntensity = 1.2; 

					}

				} );

				scene.background = background;

			}
			object.position.y = -3;
			scene.add( object );
			onWindowResize();

		}, undefined, function ( error ) {

			console.error( error );

		} );

	}

	function onWindowResize() {

		//camera.aspect = container.offsetWidth / container.offsetHeight;
		camera.updateProjectionMatrix();

		renderer.setSize( window.innerWidth, window.innerHeight );

	}

	function animate() {

		requestAnimationFrame( animate );
		if ( mixer ) mixer.update( clock.getDelta() );
		
		orbitControls.update();
		render();
		if (object) {
			scene.rotation.y += 0.005;
			object.rotation.y -= 0.005;
		}

	}

	function render() {
		renderer.render( scene, camera );
	}			

	function reload() {

		if ( loader && mixer ) mixer.stopAllAction();

		initScene( scenes[ state.scene ] );

	}

	onload();