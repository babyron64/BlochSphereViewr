blochs = [];

class Qubit {
    constructor(c0, c1) {
        this.c0 = c0;
        this.c1 = c1;

        this.phi = c0.arg() - c1.arg();
        this.theta = Math.asin(c1.abs())*2
    }

    isValid() {
        const errRange = 0.01;
        var p = Math.pow(this.c0.abs(), 2) + Math.pow(this.c1.abs(), 2)
        return Math.abs(p - 1) < errRange;
    }

    getBloch() {
        var xyProj = Math.sin(this.theta);
        var x = xyProj*Math.cos(this.phi);
        var y = xyProj*Math.sin(this.phi);
        var z = Math.cos(this.theta);
        return [x, y, z];
    }

    probe() {
        return math.pow(this.c1.abs(), 2);
    }
}

// matrix =
// [[(0, 0), (0, 1)],
//  [(1, 0), (1, 1)]]
function applyMatrix(qubit, matrix) {
    return new Qubit(
        math.add(math.multiply(qubit.c0, matrix[0][0]), math.multiply(qubit.c1, matrix[0][1])),
        math.add(math.multiply(qubit.c0, matrix[1][0]), math.multiply(qubit.c1, matrix[1][1])));
}

function I(qubit) {
    var matrix = [[1, 0], [0, 1]];
    return applyMatrix(qubit, matrix);
}

function X(qubit) {
    var matrix = [[0, 1],[1, 0]];
    return applyMatrix(qubit, matrix);
}

function Y(qubit) {
    var matrix = [[0, math.complex(0, -1)],[math.complex(0, 1), 0]];
    return applyMatrix(qubit, matrix);
}

function Z(qubit) {
    var matrix = [[1, 0],[0, -1]];
    return applyMatrix(qubit, matrix);
}

function H(qubit) {
    var matrix = [[math.sqrt(1/2), math.sqrt(1/2)],
                  [math.sqrt(1/2), -math.sqrt(1/2)]];
    return applyMatrix(qubit, matrix);
}

function S(qubit) {
    return U1(qubit, Math.PI/4);
}

function U1(qubit, lambda) {
    var matrix = [[1, 0],[0, math.exp(math.complex(0, lambda))]];
    return applyMatrix(qubit, matrix);
}

function blochInit(blochCanvases) {
    const pixelRatio = window.devicePixelRatio || 1;

    for (var canvas of blochCanvases) {
        const width = parseInt(window.getComputedStyle(canvas).width, 10);
        const height = parseInt(window.getComputedStyle(canvas).height, 10);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas
        });
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height);

        const scene = new THREE.Scene();

        // camera
        const zoom_rate = 27
        const camera = new THREE.OrthographicCamera(width / -zoom_rate, width / zoom_rate, height / zoom_rate, height / -zoom_rate, 1, 10000);
        camera.position.set(3, 3, 10);

        var controls = new THREE.OrbitControls(camera, canvas);

        // light
        const light = new THREE.DirectionalLight(0xFFFFFF);
        light.intensity = 2; // 光の強さを倍に
        light.position.set(1, 1, 1);
        scene.add(light);

        // ***************
        //     models
        // ***************
        
        function creatBloch(radius=5) {
            const bloch = new THREE.Group();
            
            // Bloch Sphere
            const grid = new THREE.Group();
            const grid_color = "#00bfff";
            const max_lon_sep = 12;
            const max_lat_sep = 8;

            var circ = new THREE.EllipseCurve(0, 0, radius, radius);

            var bloch_lat_geo = new THREE.Geometry();
            var bloch_lon_geo = new THREE.Geometry();
            const bloch_mtl = new THREE.LineBasicMaterial( { color : grid_color, linewidth: 0.8} );

            // longitude
            for (var i=0; i<max_lon_sep; i++) {
                let lon = (2 * Math.PI) * (i / max_lon_sep);
                let trans1 = new THREE.Matrix4().makeRotationZ(lon);
                let trans2 = new THREE.Matrix4().makeRotationX(Math.PI/2);

                let _geo = new THREE.BufferGeometry().setFromPoints( circ.getPoints(50) );
                _geo.applyMatrix(trans1.multiply(trans2));
                // bloch_lon_geo.merge(new THREE.Geometry().fromBufferGeometry(_geo));
                grid.add(new THREE.Line(_geo, bloch_mtl));
            }
            // latitude
            for (var i=1; i<max_lat_sep; i++) {
                let lat = Math.PI*i/max_lat_sep;
                let scale_rate = Math.sin(lat);
                let pos = Math.cos(lat) * radius;
                let trans1 = new THREE.Matrix4().makeScale(scale_rate, scale_rate, 1);
                let trans2 = new THREE.Matrix4().makeTranslation(0, 0, pos);

                let _geo = new THREE.BufferGeometry().setFromPoints( circ.getPoints(50) );
                _geo.applyMatrix(trans2.multiply(trans1))
                // bloch_lat_geo.merge(new THREE.Geometry().fromBufferGeometry(_geo));
                grid.add(new THREE.Line(_geo, bloch_mtl));
            }

            // grid.add(new THREE.Line(bloch_lon_geo, bloch_mtl));
            // grid.add(new THREE.Line(bloch_lat_geo, bloch_mtl));

            bloch.add(grid);

            // xy plane
            const xy_geo = new THREE.CircleGeometry(radius, 32);
            const xy_mtl = new THREE.MeshBasicMaterial({color: "#ffffff"});
            xy_mtl.side = THREE.DoubleSide;
            xy_mtl.transparent = true;
            xy_mtl.opacity = 0.3;
            var circle = new THREE.Mesh(xy_geo, xy_mtl );
            bloch.add( circle );

            // *** axis *** //
            var axes = new THREE.Group();

            // x axis
            const x_geo = new THREE.Geometry();
            x_geo.vertices.push(
                new THREE.Vector3( -radius, 0, 0 ),
                new THREE.Vector3( radius, 0, 0 ),
            );
            const x_mtl = new THREE.LineBasicMaterial({color: "#ff0000", linewidth: 2});
            var x_axis = new THREE.Line( x_geo, x_mtl );
            axes.add(x_axis);

            // y axis
            const y_geo = new THREE.Geometry();
            y_geo.vertices.push(
                new THREE.Vector3( 0, -radius, 0 ),
                new THREE.Vector3( 0, radius, 0 ),
            );
            const y_mtl = new THREE.LineBasicMaterial({color: "#00ff00", linewidth: 2});
            var y_axis = new THREE.Line( y_geo, y_mtl );
            axes.add(y_axis);

            // z axis
            const z_geo = new THREE.Geometry();
            z_geo.vertices.push(
                new THREE.Vector3( 0, 0, -radius),
                new THREE.Vector3( 0, 0, radius),
            );
            const z_mtl = new THREE.LineBasicMaterial({color: "#0000ff", linewidth: 2});
            var z_axis = new THREE.Line( z_geo, z_mtl );
            axes.add(z_axis);
            bloch.add(axes);

            bloch.rotation.x = Math.PI / 2;
            bloch.rotation.z = Math.PI / 2;

            //***************
            // add plot feature
            //***************
            bloch.blochOldMesh = undefined;
            bloch.blochOldGeo = undefined;
            bloch.blochPointer_mtl = new THREE.LineBasicMaterial({color: "#ffffff", linewidth: 4});
            bloch.qubit = undefined;

            bloch.blochPlot = function (qubit) {
                if (this.blochOldMesh) {
                    this.remove(this.blochOldMesh);
                    this.blochOldMesh = undefined;
                }
                if (this.blochOldGeo) {
                    this.blochOldGeo.dispose();
                    this.blochOldGeo = undefined;
                }

                var [x, y, z] = qubit.getBloch();
                x = x * radius;
                y = y * radius;
                z = z * radius;

                var pointer_geo = new THREE.Geometry();
                pointer_geo.vertices.push(
                    new THREE.Vector3( 0, 0, 0),
                    new THREE.Vector3( x, y, -z)
                );

                var pointer = new THREE.Line( pointer_geo, this.blochPointer_mtl );

                this.blochOldGeo = pointer_geo;
                this.blochOldMesh = pointer;
                this.add(pointer);
                this.qubit = qubit;
            }

            bloch.blochRender = function () {
                renderer.render(scene, camera);
                controls.update();
            }

            return bloch;
        }

        // // outline (effect)
        // const composer = new THREE.EffectComposer(renderer);
        
        // var renderPass = new THREE.RenderPass(scene, camera);
        // renderPass.renderToScreen = true;
        // composer.addPass(renderPass);
        
        // var outlinePass1 = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
        // outlinePass1.selectedObjects = [bloch];
        // outlinePass1.renderToScreen = true;
        // composer.addPass(outlinePass1);

        // var outlinePass2 = new THREE.OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
        // outlinePass2.selectedObjects = [circle];
        // outlinePass2.renderToScreen = true;
        // composer.addPass(outlinePass2);
        
        var bloch = creatBloch();
        scene.add(bloch);
        blochs.push(bloch);
    }

    animate();
}

//*******************
//      Debug
//*******************
// var _lambda = 0;
// const _qubit = new Qubit(math.complex(math.sqrt(1/3), 0), math.complex(math.sqrt(2/3), 0));
function animate() {
    requestAnimationFrame(animate);

    // _lambda += 0.01;
    // var __qubit = U1(_qubit, _lambda);

    // composer.render();
    blochs.forEach(function (bloch) {
        // bloch.blochPlot(__qubit);
        bloch.blochRender();
    });
}
