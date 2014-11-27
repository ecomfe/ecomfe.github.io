define(['qtek', 'knockout', 'ko.mapping'], function(qtek, ko, koMapping){

    var qtek3d = qtek['3d'];
    var Vector3 = qtek.core.Vector3;
    var Shader = qtek3d.Shader;

    function getResourcePath(path) {
        if (path[0] !== '/') {
            path = '/' + path;
        }
        return '../../server/proxy.php?bucket=sponza&object=' + path
    }

    function getUrlVars(){
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++){
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
    var env = getUrlVars();
    var textureResolution = env.texture || "high";
    var shadowResolution = parseInt(env.shadow || 512);

    var renderer = new qtek3d.Renderer({
        canvas : document.getElementById( "Main"),
        // devicePixelRatio : 1.0
    });
    renderer.resize(window.innerWidth, window.innerHeight);
    var animation = new qtek.animation.Animation();
    animation.start();

    var scene;
    var camera;
    window.shadowMapPass = new qtek3d.prePass.ShadowMap({
        useVSM : true
    });

    if( textureResolution === "high"){
        var texturePath = getResourcePath("assets/textures")
    }else{
        var texturePath = getResourcePath("assets/textures_" + textureResolution)
    }
    var loader = new qtek.loader.GLTF({
        textureRootPath : texturePath,
        bufferRootPath : getResourcePath("assets/")
    });
    loader.load(getResourcePath("assets/sponza.json"));

    loader.on("load", function(sponzaScene, sponzaCameras){
        // camera = sponzaCameras[Object.keys(sponzaCameras)[0]];
        camera = new qtek3d.camera.Perspective({
            aspect : window.innerWidth / window.innerHeight
        });
        camera.position.set(10, 10, 0);
        camera.lookAt(new qtek.core.Vector3(0, 10, 0))
        scene = sponzaScene;
        var firstPersonControl = new qtek3d.plugin.FirstPersonControl({
            target : camera,
            domElement : renderer.canvas
        });
        firstPersonControl.enable();

        window.light = new qtek3d.light.Point({
            intensity : 0.9,
            // shadowCamera : {
            //     left : -50,
            //     right : 50,
            //     top : 50,
            //     bottom : -50,
            //     near : 0,
            //     far : 200
            // },
            castShadow : true,
            shadowResolution : 512,
            shadowBias : 0.01,
            range : 100
        });
        light.position.set(10, 10, 0);
        light.lookAt(new qtek.core.Vector3(0, 0, 0));
        scene.add(light);
        scene.add(new qtek3d.light.Ambient({
            intensity : 0.2
        }));

        scene.traverse(function(node) {
            if (node.geometry) {
                node.geometry = node.geometry.convertToGeometry();
                node.geometry.generateTangents();
            }
            if (node.material) {
                // node.material.shader.define('fragment', 'RENDER_NORMAL');
                // node.material.shader.disableTexture('diffuseMap');
                // node.material.shader.disableTexture('normalMap');
            }
        });

        shadowMapPass.render(renderer, scene);
        animation.on('frame', function(deltaTime) {
            var time = performance.now();
            var shadowPassTime = performance.now() - time;
            time = performance.now();
            var renderInfo = renderer.render(scene, camera);
            var renderTime = performance.now() - time;
            // shadowMapPass.renderDebug(renderer);
            // Update debug render info
            renderInfo.shadowPassTime = shadowPassTime;
            renderInfo.renderTime = renderTime;
            renderInfo.fps = Math.round(1000 / deltaTime);
            koMapping.fromJS(renderInfo, mapping, debugInfoVM);
        });
    });


    // Show debug render info
    var mapping = {
        "ignore" : []
    };
    var debugInfoVM = koMapping.fromJS({
        faceNumber : 0,
        vertexNumber : 0,
        drawCallNumber : 0,
        renderTime : 0,
        shadowPassTime : 0,
        meshNumber : 0,
        fps : 0
    }, mapping);
    debugInfoVM.useWireframe = ko.observable(false);

    debugInfoVM.useWireframe.subscribe(function(value){
        if(value){
            scene.traverse(function(node){
                if(node.geometry){
                    node.mode = qtek3d.Mesh.LINES
                }
            });
        }else{
            scene.traverse(function(node){
                if(node.geometry){
                    node.mode = qtek3d.Mesh.TRIANGLES
                }
            });
        }
    });

    ko.applyBindings(debugInfoVM, document.getElementById("DebugInfo"));

})
