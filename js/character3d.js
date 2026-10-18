/**
 * Math Quest 3D characters — procedural WebGL models, no remote assets.
 * A character's type, clothing and care state come from the existing profile;
 * canvases and animation state are ephemeral and never overwrite saved progress.
 */
(() => {
    'use strict';

    const PETS = Object.freeze({
        cat: { name: 'Cat', emoji: '🐱', body: '#de9a63', belly: '#f8dfbb', accent: '#b96d45', ears: 'pointed', tail: 'long' },
        dog: { name: 'Dog', emoji: '🐶', body: '#b98252', belly: '#efcda1', accent: '#78503c', ears: 'floppy', tail: 'short' },
        rabbit: { name: 'Rabbit', emoji: '🐰', body: '#ded9ee', belly: '#ffffff', accent: '#f3a8c4', ears: 'long', tail: 'puff' },
        fox: { name: 'Fox', emoji: '🦊', body: '#ed8546', belly: '#fff0d1', accent: '#a54a2e', ears: 'pointed', tail: 'bushy' },
        panda: { name: 'Panda', emoji: '🐼', body: '#f4f3f0', belly: '#ffffff', accent: '#343444', ears: 'round', tail: 'puff' },
        lion: { name: 'Lion', emoji: '🦁', body: '#deb060', belly: '#f7d895', accent: '#9d6435', ears: 'round', tail: 'tuft' },
        dragon_pet: { name: 'Dragon', emoji: '🐉', body: '#5bbb92', belly: '#b7efd4', accent: '#437bba', ears: 'horns', tail: 'spade' },
        phoenix: { name: 'Phoenix', emoji: '🔥', body: '#f18b42', belly: '#ffd071', accent: '#c73f4f', ears: 'crest', tail: 'feathers' }
    });
    const AVATARS = Object.freeze({
        default: { name: 'Adventurer', skin: '#dfae90', hair: '#4c3248', outfit: '#6477d9', detail: '#dce7ff', model: 'human' },
        boy_student: { name: 'Boy Student', skin: '#c98f73', hair: '#362a35', outfit: '#478fc0', detail: '#f2f6ff', model: 'student' },
        girl_student: { name: 'Girl Student', skin: '#e7b99f', hair: '#694450', outfit: '#b568ba', detail: '#ffe0ef', model: 'student' },
        man: { name: 'Man', skin: '#b88468', hair: '#403235', outfit: '#448a86', detail: '#e1f4ed', model: 'human' },
        woman: { name: 'Woman', skin: '#e1ad91', hair: '#553a42', outfit: '#c06687', detail: '#ffecf2', model: 'human' },
        teacher: { name: 'Teacher', skin: '#c9967b', hair: '#51423d', outfit: '#736bb8', detail: '#fff3cf', model: 'teacher' },
        scientist: { name: 'Scientist', skin: '#d3a184', hair: '#594339', outfit: '#d2e6f8', detail: '#367ba6', model: 'scientist' },
        wizard: { name: 'Wizard', skin: '#e6b9a0', hair: '#b4adba', outfit: '#6955b8', detail: '#d7b5ff', model: 'wizard' },
        ninja: { name: 'Ninja', skin: '#ba8a72', hair: '#24273b', outfit: '#303854', detail: '#e34972', model: 'ninja' },
        astronaut: { name: 'Astronaut', skin: '#e3b89e', hair: '#4e3b39', outfit: '#f0f2fa', detail: '#59b9e8', model: 'astronaut' },
        robot: { name: 'Robot', skin: '#b9cbda', hair: '#455f86', outfit: '#7185ad', detail: '#50e4ff', model: 'robot' },
        alien: { name: 'Alien', skin: '#91d9aa', hair: '#497b7d', outfit: '#4c90a4', detail: '#c2f5ff', model: 'alien' },
        dragon: { name: 'Dragon', skin: '#77c9a7', hair: '#438887', outfit: '#448d79', detail: '#e4d67c', model: 'dragon' },
        unicorn: { name: 'Unicorn', skin: '#e9bad7', hair: '#bb84c9', outfit: '#af8bd0', detail: '#f3dafa', model: 'unicorn' },
        king: { name: 'King', skin: '#cda082', hair: '#53362d', outfit: '#614fba', detail: '#ffdb75', model: 'royal' },
        queen: { name: 'Queen', skin: '#dfad92', hair: '#77506a', outfit: '#a956ae', detail: '#ffdb75', model: 'royal' }
    });
    const clamp = (n, a, b) => Math.min(b, Math.max(a, Number(n) || 0));
    const rgb = (hex) => {
        const h = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex.slice(1) : 'ffffff';
        return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
    };

    // Matrices use WebGL's column-major convention throughout.
    const ID = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    const mul = (a, b) => {
        const o = new Array(16);
        for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
            o[c * 4 + r] = 0;
            for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
        }
        return o;
    };
    const tmat = (x, y, z) => { const o = ID(); o[12] = x; o[13] = y; o[14] = z; return o; };
    const smat = (x, y, z) => { const o = ID(); o[0] = x; o[5] = y; o[10] = z; return o; };
    const ry = a => { const o = ID(), c = Math.cos(a), s = Math.sin(a); o[0] = c; o[2] = -s; o[8] = s; o[10] = c; return o; };
    const rx = a => { const o = ID(), c = Math.cos(a), s = Math.sin(a); o[5] = c; o[6] = s; o[9] = -s; o[10] = c; return o; };
    const rz = a => { const o = ID(), c = Math.cos(a), s = Math.sin(a); o[0] = c; o[1] = s; o[4] = -s; o[5] = c; return o; };
    const perspective = (fovy, aspect, near, far) => {
        const f = 1 / Math.tan(fovy / 2), o = new Array(16).fill(0);
        o[0] = f / aspect; o[5] = f; o[10] = (far + near) / (near - far);
        o[11] = -1; o[14] = 2 * far * near / (near - far); return o;
    };
    const lookAt = (eye, target) => {
        const normalize = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
        const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const z = normalize(eye.map((x, i) => x - target[i]));
        const x = normalize(cross([0, 1, 0], z)); const y = cross(z, x);
        return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
            -x.reduce((s, v, i) => s + v * eye[i], 0),
            -y.reduce((s, v, i) => s + v * eye[i], 0),
            -z.reduce((s, v, i) => s + v * eye[i], 0), 1];
    };
    const modelMatrix = (base, pos, scale, rotate = [0, 0, 0]) =>
        mul(mul(mul(mul(mul(base, tmat(...pos)), rz(rotate[2] || 0)), ry(rotate[1] || 0)), rx(rotate[0] || 0)), smat(...scale));

    const geometry = {
        sphere(lat = 12, lon = 18) {
            const verts = [], indices = [];
            for (let y = 0; y <= lat; y++) {
                const theta = y * Math.PI / lat;
                for (let x = 0; x <= lon; x++) {
                    const phi = x * Math.PI * 2 / lon;
                    const n = [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)];
                    verts.push(...n, ...n);
                }
            }
            for (let y = 0; y < lat; y++) for (let x = 0; x < lon; x++) {
                const a = y * (lon + 1) + x, b = a + lon + 1;
                indices.push(a, b, a + 1, a + 1, b, b + 1);
            }
            return { verts, indices };
        },
        cube() {
            const verts = [], indices = [];
            const faces = [
                [[0, 0, 1], [[-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5]]],
                [[0, 0, -1], [[.5, -.5, -.5], [-.5, -.5, -.5], [-.5, .5, -.5], [.5, .5, -.5]]],
                [[1, 0, 0], [[.5, -.5, .5], [.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5]]],
                [[-1, 0, 0], [[-.5, -.5, -.5], [-.5, -.5, .5], [-.5, .5, .5], [-.5, .5, -.5]]],
                [[0, 1, 0], [[-.5, .5, .5], [.5, .5, .5], [.5, .5, -.5], [-.5, .5, -.5]]],
                [[0, -1, 0], [[-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5], [-.5, -.5, .5]]]
            ];
            for (const [normal, corners] of faces) {
                const index = verts.length / 6;
                for (const p of corners) verts.push(...p, ...normal);
                indices.push(index, index + 1, index + 2, index, index + 2, index + 3);
            }
            return { verts, indices };
        },
        cylinder(cone = false) {
            const verts = [], indices = [], sides = 16;
            for (let layer = 0; layer <= 1; layer++) for (let i = 0; i <= sides; i++) {
                const angle = i * Math.PI * 2 / sides, x = Math.cos(angle), z = Math.sin(angle);
                const rad = cone && layer ? 0 : .5;
                const normal = [x, cone ? .45 : 0, z];
                const nlen = Math.hypot(...normal);
                verts.push(x * rad, layer - .5, z * rad, ...normal.map(n => n / nlen));
            }
            for (let i = 0; i < sides; i++) {
                const a = i, b = i + sides + 1;
                indices.push(a, a + 1, b, a + 1, b + 1, b);
            }
            for (const top of [false, true]) {
                if (top && cone) continue;
                const index = verts.length / 6, y = top ? .5 : -.5;
                verts.push(0, y, 0, 0, top ? 1 : -1, 0);
                for (let i = 0; i <= sides; i++) {
                    const a = i * Math.PI * 2 / sides;
                    verts.push(Math.cos(a) * .5, y, Math.sin(a) * .5, 0, top ? 1 : -1, 0);
                }
                for (let i = 0; i < sides; i++) {
                    if (top) indices.push(index, index + i + 1, index + i + 2);
                    else indices.push(index, index + i + 2, index + i + 1);
                }
            }
            return { verts, indices };
        },
        wing() {
            const verts = [], indices = [];
            const pts = [[0, 0, 0], [1, .4, -.15], [1.2, -.8, -.05], [.5, -.5, .15]];
            for (const normal of [[0, 0, 1], [0, 0, -1]]) {
                for (const v of pts) verts.push(...v, ...normal);
            }
            indices.push(0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6);
            return { verts, indices };
        }
    };

    // Lower-polygon copies of the same true 3D meshes for machines without WebGL.
    // All coordinates are transformed in three dimensions before projection.
    const SOFTWARE_MESHES = {
        sphere: geometry.sphere(8, 12), cube: geometry.cube(),
        cylinder: geometry.cylinder(), cone: geometry.cylinder(true), wing: geometry.wing()
    };

    const vertexSource = `
        attribute vec3 aPosition;
        attribute vec3 aNormal;
        uniform mat4 uProjection, uView, uModel;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vec4 world = uModel * vec4(aPosition, 1.0);
            vNormal = normalize(mat3(uModel) * aNormal);
            vPosition = world.xyz;
            gl_Position = uProjection * uView * world;
        }`;
    const fragmentSource = `
        precision mediump float;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec4 uColor;
        void main() {
            vec3 lightDirection = normalize(vec3(-0.50, 1.25, 1.9));
            float lit = max(dot(normalize(vNormal), lightDirection), 0.0);
            float shade = 0.60 + 0.40 * lit;
            float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vec3(0.0, 0.4, 1.0)))), 3.0) * 0.08;
            gl_FragColor = vec4(uColor.rgb * (shade + rim), uColor.a);
        }`;

    class Stage {
        constructor(host, options) {
            this.host = host;
            this.options = { ...options };
            this.isPet = options.kind === 'pet';
            this.yaw = -0.20;
            this.running = true;
            this.animUntil = 0;
            this.action = 'idle';
            this.frame = 0;
            this.lastFrame = -Infinity;
            this.dragPointer = null;
            this.dragX = 0;
            this.reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'character-webgl';
            this.canvas.tabIndex = 0;
            this.canvas.setAttribute('role', 'img');
            this.canvas.setAttribute('aria-label', `${options.name || 'Character'}, three-dimensional interactive ${options.kind}`);
            this.canvas.title = 'Drag to rotate, use arrow keys to turn, or press Space for a reaction';
            this.fallback = document.createElement('span');
            this.fallback.className = 'character-emoji-fallback';
            this.fallback.textContent = options.emoji || (this.isPet ? '🐾' : '👤');
            this.fallback.setAttribute('role', 'img');
            this.fallback.setAttribute('aria-label', options.name || 'Character');
            host.replaceChildren(this.canvas, this.fallback);
            host.dataset.modelId = options.id || '';
            host.dataset.modelKind = options.kind || '';
            this.attachInput();
            try {
                this.gl = this.canvas.getContext('webgl', { alpha: true, antialias: true,
                    premultipliedAlpha: false, powerPreference: 'low-power' });
                if (this.gl) {
                    this.createGpuResources();
                    this.renderer = 'webgl';
                } else {
                    // Software perspective renderer: not a flat sprite or emoji.
                    // Runs the same geometry on Canvas 2D without requiring a GPU.
                    this.ctx2d = this.canvas.getContext('2d');
                    if (!this.ctx2d) throw new Error('3D drawing unavailable');
                    this.renderer = 'canvas3d';
                    this.softwareMeshes = SOFTWARE_MESHES;
                }
                this.canvas.classList.add('available');
                this.fallback.hidden = true;
                this.resize();
                if (typeof ResizeObserver !== 'undefined') {
                    this.resizeObserver = new ResizeObserver(() => this.resize());
                    this.resizeObserver.observe(host);
                }
                this.loop = timestamp => {
                    if (!this.running) return;
                    if (typeof document !== 'undefined' && document.hidden) {
                        this.frame = requestAnimationFrame(this.loop); return;
                    }
                    if (timestamp - this.lastFrame >= (this.reducedMotion ? 240 : this.ctx2d ? 92 : 32)) {
                        this.lastFrame = timestamp;
                        this.draw(timestamp / 1000);
                    }
                    this.frame = requestAnimationFrame(this.loop);
                };
                this.frame = requestAnimationFrame(this.loop);
            } catch (error) {
                this.canvas.classList.remove('available');
                this.fallback.hidden = false;
                this.error = error.message;
            }
        }
        attachInput() {
            this.pointerStart = e => {
                if (e.button !== 0) return;
                this.dragPointer = e.pointerId;
                this.dragX = e.clientX;
                this.canvas.setPointerCapture?.(e.pointerId);
            };
            this.pointerMove = e => {
                if (e.pointerId !== this.dragPointer) return;
                this.yaw += (e.clientX - this.dragX) * 0.014;
                this.dragX = e.clientX;
                this.drawNow();
            };
            this.pointerEnd = e => { if (e.pointerId === this.dragPointer) this.dragPointer = null; };
            this.keyDown = e => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault(); this.yaw += (e.key === 'ArrowLeft' ? -1 : 1) * 0.22;
                    this.drawNow();
                } else if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault(); this.react('play');
                }
            };
            this.canvas.addEventListener('pointerdown', this.pointerStart);
            this.canvas.addEventListener('pointermove', this.pointerMove);
            this.canvas.addEventListener('pointerup', this.pointerEnd);
            this.canvas.addEventListener('pointercancel', this.pointerEnd);
            this.canvas.addEventListener('keydown', this.keyDown);
            this.contextLost = e => { e.preventDefault(); this.error = 'WebGL context lost'; this.fallback.hidden = false; this.canvas.classList.remove('available'); };
            this.canvas.addEventListener('webglcontextlost', this.contextLost);
        }
        createGpuResources() {
            const gl = this.gl;
            const compile = (type, source) => {
                const shader = gl.createShader(type);
                gl.shaderSource(shader, source); gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    const msg = gl.getShaderInfoLog(shader); gl.deleteShader(shader);
                    throw new Error(`Shader compilation failed: ${msg}`);
                }
                return shader;
            };
            const vert = compile(gl.VERTEX_SHADER, vertexSource);
            const frag = compile(gl.FRAGMENT_SHADER, fragmentSource);
            const program = gl.createProgram();
            gl.attachShader(program, vert); gl.attachShader(program, frag); gl.linkProgram(program);
            gl.deleteShader(vert); gl.deleteShader(frag);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
            this.program = program;
            this.locations = {
                aPosition: gl.getAttribLocation(program, 'aPosition'), aNormal: gl.getAttribLocation(program, 'aNormal'),
                projection: gl.getUniformLocation(program, 'uProjection'),
                view: gl.getUniformLocation(program, 'uView'), model: gl.getUniformLocation(program, 'uModel'),
                color: gl.getUniformLocation(program, 'uColor')
            };
            this.meshes = {};
            const meshes = { sphere: geometry.sphere(), cube: geometry.cube(),
                cylinder: geometry.cylinder(), cone: geometry.cylinder(true), wing: geometry.wing() };
            for (const [key, mesh] of Object.entries(meshes)) {
                const vertices = gl.createBuffer(), indices = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.verts), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW);
                this.meshes[key] = { vertices, indices, count: mesh.indices.length };
            }
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }
        resize() {
            if ((!this.gl && !this.ctx2d) || !this.running) return;
            const w = this.host.clientWidth || 240;
            const h = this.host.clientHeight || 240;
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            const width = Math.max(1, Math.min(1024, Math.round(w * dpr)));
            const height = Math.max(1, Math.min(768, Math.round(h * dpr)));
            if (width !== this.canvas.width || height !== this.canvas.height) {
                this.canvas.width = width; this.canvas.height = height;
                if (this.gl) this.gl.viewport(0, 0, width, height);
            }
        }
        drawMesh(shape, color, pos, size, rotation = [0, 0, 0], parent = ID(), alpha = 1) {
            if (this.ctx2d) return this.drawSoftwareMesh(shape, color, pos, size, rotation, parent, alpha);
            const gl = this.gl, mesh = this.meshes[shape];
            if (!mesh) return;
            const loc = this.locations;
            gl.uniformMatrix4fv(loc.model, false, new Float32Array(modelMatrix(parent, pos, size, rotation)));
            gl.uniform4fv(loc.color, new Float32Array([...rgb(color), alpha]));
            gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertices);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
            gl.enableVertexAttribArray(loc.aPosition); gl.vertexAttribPointer(loc.aPosition, 3, gl.FLOAT, false, 24, 0);
            gl.enableVertexAttribArray(loc.aNormal); gl.vertexAttribPointer(loc.aNormal, 3, gl.FLOAT, false, 24, 12);
            gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
        }
        // Painter-style CPU 3D rasterization: rotate actual vertices, project
        // through a perspective camera, depth-sort polygons and shade faces.
        // This is used only when WebGL is unavailable.
        drawSoftwareMesh(shape, color, pos, size, rotation, parent, alpha) {
            const mesh = this.softwareMeshes[shape];
            if (!mesh) return;
            const matrix = modelMatrix(parent, pos, size, rotation);
            const verts = mesh.verts, indices = mesh.indices;
            const vertices = [];
            const m = matrix, v = this.softwareView, vp = this.softwareVP;
            const W = this.canvas.width, H = this.canvas.height;
            for (let i = 0; i < verts.length; i += 6) {
                const x = verts[i], y = verts[i+1], z = verts[i+2];
                const wx = m[0]*x + m[4]*y + m[8]*z + m[12];
                const wy = m[1]*x + m[5]*y + m[9]*z + m[13];
                const wz = m[2]*x + m[6]*y + m[10]*z + m[14];
                const px = vp[0]*wx + vp[4]*wy + vp[8]*wz + vp[12];
                const py = vp[1]*wx + vp[5]*wy + vp[9]*wz + vp[13];
                const pw = vp[3]*wx + vp[7]*wy + vp[11]*wz + vp[15];
                const depth = v[2]*wx + v[6]*wy + v[10]*wz + v[14];
                // A transformed normal is sufficient for simple Lambert shading.
                const nx = m[0]*verts[i+3] + m[4]*verts[i+4] + m[8]*verts[i+5];
                const ny = m[1]*verts[i+3] + m[5]*verts[i+4] + m[9]*verts[i+5];
                const nz = m[2]*verts[i+3] + m[6]*verts[i+4] + m[10]*verts[i+5];
                const nl = Math.hypot(nx, ny, nz) || 1;
                vertices.push({ x: (px/pw*.5+.5)*W, y: (1-(py/pw*.5+.5))*H,
                    pw, depth, nx:nx/nl,ny:ny/nl,nz:nz/nl, wx,wy,wz });
            }
            const [r,g,b] = rgb(color);
            for (let i = 0; i < indices.length; i += 3) {
                const a = vertices[indices[i]], bb = vertices[indices[i+1]], c = vertices[indices[i+2]];
                if (a.pw <= .1 || bb.pw <= .1 || c.pw <= .1) continue;
                const nx = (a.nx + bb.nx + c.nx)/3;
                const ny = (a.ny + bb.ny + c.ny)/3;
                const nz = (a.nz + bb.nz + c.nz)/3;
                // Hide invisible back sides. Wing triangles have faces on both sides.
                const center = [(a.wx+bb.wx+c.wx)/3, (a.wy+bb.wy+c.wy)/3, (a.wz+bb.wz+c.wz)/3];
                const toCamera = [this.eye[0]-center[0],this.eye[1]-center[1],this.eye[2]-center[2]];
                if (nx*toCamera[0]+ny*toCamera[1]+nz*toCamera[2] < 0) continue;
                const light = Math.max(0, (nx*(-.50)+ny*1.25+nz*1.90) / (Math.hypot(nx,ny,nz)*2.33 || 1));
                const shade = Math.min(1.15, .60 + .40*light);
                this.softwareFaces.push({
                    x1:a.x,y1:a.y,x2:bb.x,y2:bb.y,x3:c.x,y3:c.y,
                    depth:(a.depth+bb.depth+c.depth)/3,
                    fill:`rgba(${Math.round(r*shade*255)},${Math.round(g*shade*255)},${Math.round(b*shade*255)},${alpha})`
                });
            }
        }
        flushSoftwareFrame() {
            // Draw distant faces first. No fixed sprite or image substitutions.
            this.softwareFaces.sort((a,b) => a.depth - b.depth);
            const ctx = this.ctx2d;
            for (const face of this.softwareFaces) {
                ctx.beginPath();
                ctx.moveTo(face.x1,face.y1);
                ctx.lineTo(face.x2,face.y2);
                ctx.lineTo(face.x3,face.y3);
                ctx.closePath();
                ctx.fillStyle = face.fill;
                ctx.fill();
            }
            this.softwareFaces.length = 0;
        }
        drawSoftwareGround() {
            // A consistent lit pedestal, painted behind projected 3D geometry.
            // Avoids z-fighting seams from coplanar top facets in Canvas 2D.
            const ctx = this.ctx2d, w = this.canvas.width, h = this.canvas.height;
            const cy = h * .78, radiusX = Math.min(w * .34, h * .87), radiusY = h * .13;
            ctx.beginPath(); ctx.ellipse(w/2, cy+8, radiusX, radiusY, 0, 0, Math.PI*2);
            ctx.fillStyle = this.isPet ? '#457c79' : '#525a9f'; ctx.fill();
            ctx.beginPath(); ctx.ellipse(w/2, cy, radiusX, radiusY, 0, 0, Math.PI*2);
            ctx.fillStyle = this.isPet ? '#75c7ae' : '#949bd2'; ctx.fill();
            ctx.beginPath(); ctx.ellipse(w/2, cy+2, radiusX*.43, radiusY*.45, 0, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(26,39,64,.13)'; ctx.fill();
        }
        drawNow() { if ((this.gl || this.ctx2d) && !this.error) this.draw(performance.now() / 1000); }
        react(action) {
            this.action = action;
            this.animUntil = performance.now() + 1050;
            this.drawNow();
        }
        update(options) {
            const old = this.options;
            this.options = { ...options };
            this.fallback.textContent = options.emoji || old.emoji || '👤';
            this.canvas.setAttribute('aria-label', `${options.name || 'Character'}, interactive 3D ${options.kind}`);
            this.fallback.setAttribute('aria-label', options.name || 'Character');
            this.drawNow();
        }
        draw(seconds) {
            if ((!this.gl && !this.ctx2d) || this.error || !this.running) return;
            this.resize();
            const gl = this.gl, loc = this.locations;
            if (gl) {
                gl.viewport(0, 0, this.canvas.width, this.canvas.height);
                gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.useProgram(this.program);
            } else {
                this.ctx2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.softwareFaces = [];
            }
            const aspect = Math.max(.35, this.canvas.width / this.canvas.height);
            const compact = aspect < .85;
            const eye = this.isPet ? [0, 2.0, compact ? 6.1 : 5.6] : [0, 2.0, compact ? 6.5 : 5.7];
            const proj = perspective(.72, aspect, .1, 30);
            const view = lookAt(eye, [0, 1.08, 0]);
            if (gl) {
                gl.uniformMatrix4fv(loc.projection, false, new Float32Array(proj));
                gl.uniformMatrix4fv(loc.view, false, new Float32Array(view));
            } else {
                this.eye = eye;
                this.softwareView = view;
                this.softwareVP = mul(proj, view);
            }
            const active = performance.now() < this.animUntil;
            const period = this.reducedMotion ? 0 : seconds;
            const energy = active ? 1 : .20;
            // Pedestal and cast shadow share the same 3D camera as the character.
            if (this.ctx2d) this.drawSoftwareGround();
            else {
                this.drawMesh('cylinder', this.isPet ? '#74cbb7' : '#777fc9', [0, -.17, 0], [3.7, .22, 2.7]);
                this.drawMesh('cylinder', this.isPet ? '#a7efbe' : '#bdc9fa', [0, -.04, 0], [3.65, .07, 2.65]);
                this.drawMesh('sphere', '#52606d', [0, .014, -.05], [1.0, .015, .64], [0, 0, 0], ID(), .30);
            }
            if (this.isPet) this.drawPet(period, energy, active);
            else this.drawAvatar(period, energy, active);
            if (this.ctx2d) this.flushSoftwareFrame();
        }
        drawPet(time, energy, active) {
            const cfg = PETS[this.options.id] || PETS.cat;
            const hunger = clamp(this.options.hunger ?? 50, 0, 100);
            const happiness = clamp(this.options.happiness ?? 75, 0, 100);
            const distressed = hunger >= 85 || happiness <= 18 || (active && this.action === 'incorrect');
            const isBird = this.options.id === 'phoenix';
            const isDragon = this.options.id === 'dragon_pet';
            const bob = this.reducedMotion ? 0 : (distressed ? .012 : .035) * Math.sin(time * (distressed ? 1.1 : 2.4));
            const hop = active && this.action !== 'incorrect' && !this.reducedMotion ? .22 * Math.abs(Math.sin(time * 11)) : 0;
            const wander = this.reducedMotion || distressed ? 0 : Math.sin(time * .55) * .18;
            const droop = distressed ? -.08 : 0;
            const base = mul(tmat(wander, bob + hop + droop, 0), ry(this.yaw + (this.reducedMotion ? 0 : Math.sin(time * .31) * .09)));
            const p = (shape, color, pos, size, rotate = [0, 0, 0], parent = base, alpha = 1) =>
                this.drawMesh(shape, color, pos, size, rotate, parent, alpha);
            const footSwing = this.reducedMotion || distressed ? 0 : Math.sin(time * 3.1) * .08;
            if (isBird) {
                p('sphere', cfg.body, [0, .95, 0], [.48, .66, .42]);
                p('sphere', cfg.belly, [0, .86, .24], [.34, .48, .22]);
                p('sphere', cfg.body, [0, 1.68, .17], [.38, .43, .36]);
                p('cone', '#ffd161', [0, 1.54, .52], [.29, .42, .29], [1.18, 0, 0]);
                for (const side of [-1, 1]) {
                    const flap = active && !this.reducedMotion ? .34 * Math.sin(time * 10) : .08 * Math.sin(time * 2);
                    p('wing', cfg.accent, [side * .40, 1.24, -.08], [side * .94, .85 + flap, .27], [0, 0, side * flap]);
                    p('sphere', '#272435', [side * .16, 1.75, .49], [.055, .085, .047]);
                    p('cylinder', '#b86e44', [side * .21, .27, .20], [.08, .43, .08]);
                    p('sphere', '#b86e44', [side * .21, .06, .38], [.18, .09, .23]);
                }
                for (let i = -1; i <= 1; i++) {
                    p('cone', i === 0 ? '#fff1a0' : '#f7a44a', [i * .16, 2.05, .11], [.18, .60, .16], [0, 0, i * -.23]);
                    p('cone', '#d84a55', [i * .30, .63, -.36], [.20, .90, .19], [.65, 0, i * .28]);
                }
                return;
            }
            p('sphere', cfg.body, [0, .90, -.09], [.69, .53, .60]);
            p('sphere', cfg.belly, [0, .84, .36], [.46, .39, .25]);
            const footColor = this.options.id === 'panda' ? cfg.accent : cfg.body;
            for (const side of [-1, 1]) for (const z of [-.43, .35]) {
                p('sphere', footColor, [side * .45, .39, z], [.22, .38, .23], [0, 0, footSwing * side * (z > 0 ? 1 : -1)]);
                p('sphere', cfg.belly, [side * .45, .10, z + .11], [.22, .11, .27]);
            }
            if (this.options.id === 'lion') p('sphere', '#a46d3f', [0, 1.51, .35], [.67, .66, .57]);
            p('sphere', cfg.body, [0, 1.53, .36], [.48, .46, .45], [distressed ? .10 : 0, 0, 0]);
            p('sphere', cfg.belly, [0, 1.34, .70], [.32, .21, .24]);
            // Distinct ears are built as 3D primitives, not emoji textures.
            for (const side of [-1, 1]) {
                const s = side;
                if (cfg.ears === 'pointed' || cfg.ears === 'horns') {
                    p('cone', cfg.ears === 'horns' ? cfg.accent : cfg.body,
                        [s * .35, 2.01, .27], [.34, .58, .28], [0, 0, s * -.12]);
                    if (cfg.ears !== 'horns') p('cone', cfg.accent, [s * .35, 2.02, .43], [.18, .37, .12], [0, 0, s * -.12]);
                } else if (cfg.ears === 'long') {
                    p('sphere', cfg.body, [s * .28, 2.26, .19], [.19, .62, .19], [0, 0, s * .13]);
                    p('sphere', cfg.accent, [s * .28, 2.28, .35], [.105, .44, .04], [0, 0, s * .13]);
                } else if (cfg.ears === 'floppy') {
                    p('sphere', cfg.accent, [s * .47, 1.66, .25], [.24, .41, .17], [0, 0, s * .35]);
                } else {
                    p('sphere', cfg.accent, [s * .36, 1.88, .21], [.19, .24, .16]);
                }
                const isPanda = this.options.id === 'panda';
                if (isPanda) p('sphere', cfg.accent, [s * .20, 1.63, .732], [.15, .19, .07]);
                const blink = !this.reducedMotion && Math.sin(time * 1.9 + .2) > .988;
                p('sphere', isPanda ? '#ffffff' : '#faf6f0', [s * .19, 1.64, .735], [.125, blink ? .018 : .14, .078]);
                p('sphere', '#222437', [s * .19, 1.65, .805], [.065, blink ? .012 : .077, .039]);
                p('sphere', '#ffffff', [s * .174, 1.68, .837], [.02, .025, .012]);
                if (this.options.id === 'cat' || this.options.id === 'fox') {
                    p('cylinder', cfg.accent, [s * .44, 1.35, .79], [.02, .46, .02], [0, 0, 1.3]);
                }
            }
            p('sphere', this.options.id === 'rabbit' ? '#dc8ea7' : '#4b3b47', [0, 1.42, .875], [.10, .075, .075]);
            if (distressed) p('sphere', '#506d99', [.36, 1.22, .73], [.055, .12, .04]);
            const wag = this.reducedMotion ? 0 : (distressed ? .06 : .32) * Math.sin(time * 4);
            const tailRoot = mul(base, tmat(0, .91, -.63));
            if (cfg.tail === 'bushy') {
                p('sphere', cfg.body, [wag * .6, .29, -.36], [.36, .32, .68], [.23, wag, wag], tailRoot);
                p('sphere', cfg.belly, [wag * .65, .54, -.79], [.29, .26, .25], [0, 0, wag], tailRoot);
            } else if (cfg.tail === 'long' || cfg.tail === 'short' || cfg.tail === 'tuft' || cfg.tail === 'spade') {
                p('cylinder', cfg.body, [wag * .5, .23, -.26], [.13, .79, .13], [.75, 0, wag], tailRoot);
                if (cfg.tail === 'tuft' || cfg.tail === 'spade') p(cfg.tail === 'spade' ? 'cone' : 'sphere', cfg.accent,
                    [wag, .67, -.64], [.20, .30, .25], [0, 0, wag], tailRoot);
            } else if (cfg.tail === 'puff') {
                p('sphere', cfg.belly, [0, .20, -.16], [.27, .27, .27], [0, 0, wag], tailRoot);
            }
            if (isDragon) {
                for (const s of [-1, 1]) {
                    p('wing', cfg.accent, [s * .52, 1.28, -.29], [s * 1.05, .98, .62], [0, 0, s * (active ? .30 : .10)]);
                    p('cone', '#e8d8a5', [s * .26, 2.01, .28], [.15, .34, .15]);
                }
                for (let i = 0; i < 3; i++) p('cone', cfg.accent, [0, 1.20 - i * .20, -.60 - i * .04], [.28, .35, .20], [.6, 0, 0]);
            }
        }
        drawAvatar(time, energy, active) {
            const cfg = AVATARS[this.options.id] || AVATARS.default;
            const robot = cfg.model === 'robot', alien = cfg.model === 'alien';
            const isDragon = cfg.model === 'dragon', unicorn = cfg.model === 'unicorn';
            const skin = cfg.skin;
            const bob = this.reducedMotion ? 0 : .023 * Math.sin(time * 2.15);
            const hop = active && !this.reducedMotion ? .14 * Math.abs(Math.sin(time * 8)) : 0;
            const base = mul(tmat(0, bob + hop, 0), ry(this.yaw));
            const p = (shape, color, pos, size, rotate = [0, 0, 0], parent = base, alpha = 1) =>
                this.drawMesh(shape, color, pos, size, rotate, parent, alpha);
            const sway = this.reducedMotion ? 0 : Math.sin(time * 2.3) * .065;
            for (const side of [-1, 1]) {
                p(robot ? 'cube' : 'sphere', '#303348', [side * .23, .28, .12], [.23, .18, .36]);
                p(robot ? 'cube' : 'cylinder', cfg.outfit, [side * .22, .62, -.01], [.26, .83, .28], [0, 0, side * sway]);
            }
            p(robot ? 'cube' : 'sphere', cfg.outfit, [0, 1.40, -.03], robot ? [.91, 1.12, .51] : [.55, .70, .39]);
            if (cfg.model === 'scientist') {
                p('cube', '#f8faff', [-.36, 1.35, .27], [.24, .78, .17]);
                p('cube', '#f8faff', [.36, 1.35, .27], [.24, .78, .17]);
                p('cube', cfg.detail, [0, 1.44, .37], [.12, .45, .04]);
            } else if (cfg.model === 'wizard') {
                p('cone', cfg.outfit, [0, .98, -.03], [1.22, 1.22, .69]);
                p('sphere', '#f1ca86', [0, 1.50, .36], [.13, .13, .07]);
            } else {
                p('cube', cfg.detail, [0, 1.41, .33], [.14, .20, .05]);
            }
            for (const side of [-1, 1]) {
                const waving = side === 1 && active && !this.reducedMotion;
                const swing = waving ? -.85 + Math.sin(time * 11) * .24 : side * .12 + sway;
                p(robot ? 'cube' : 'sphere', cfg.outfit, [side * .65, 1.42, -.02], [.21, .48, .22], [0, 0, side * swing]);
                p(robot ? 'cube' : 'sphere', skin, [side * (.66 + (waving ? .26 : .02)), waving ? 1.69 : 1.04, .02], [.17, .17, .18]);
            }
            // Head is a genuine curved / cuboid 3D mesh with a visible profile from the side.
            const headShape = robot ? 'cube' : 'sphere';
            p(headShape, skin, [0, 2.20, .03], alien ? [.45, .49, .39] : [.35, .42, .33]);
            if (!robot && !alien && cfg.model !== 'ninja' && cfg.model !== 'astronaut') {
                p('sphere', cfg.hair, [0, 2.48, -.04], [.36, .21, .33]);
                if (['woman', 'girl_student', 'queen', 'wizard'].includes(this.options.id)) {
                    for (const s of [-1, 1]) p('sphere', cfg.hair, [s * .31, 2.20, -.16], [.13, .35, .17]);
                }
            }
            if (cfg.model === 'ninja') {
                p('sphere', cfg.outfit, [0, 2.23, -.05], [.37, .43, .33]);
                p('cube', '#2a3047', [0, 2.14, .29], [.66, .12, .09]);
            }
            if (cfg.model === 'astronaut') {
                p('sphere', '#c8d3e8', [0, 2.20, -.01], [.48, .53, .44]);
                p('sphere', '#659dd3', [0, 2.21, .31], [.33, .29, .18]);
            } else if (robot) {
                p('cube', '#4c6b93', [0, 2.40, -.04], [.68, .19, .68]);
                p('cylinder', cfg.detail, [0, 2.67, -.02], [.06, .29, .06]);
                p('sphere', cfg.detail, [0, 2.85, -.02], [.13, .13, .13]);
            }
            if (cfg.model !== 'astronaut') {
                for (const s of [-1, 1]) {
                    p('sphere', robot ? cfg.detail : alien ? '#172438' : '#2b2937',
                        [s * (alien ? .22 : .14), 2.25, robot ? .41 : alien ? .36 : .335],
                        alien ? [.115, .21, .10] : robot ? [.10, .09, .05] : [.055, .069, .036]);
                    if (!robot && !alien) p('sphere', '#ffffff', [s * .14 - .015, 2.272, .365], [.017, .024, .013]);
                }
                if (!robot && !alien) p('sphere', '#915d5e', [0, 2.06, .357], [.105, .03, .02]);
            }
            if (cfg.model === 'teacher' || cfg.model === 'scientist') {
                for (const s of [-1, 1]) {
                    p('cube', '#32374b', [s * .14, 2.25, .377], [.24, .16, .035]);
                    p('cube', '#32374b', [0, 2.26, .38], [.12, .025, .035]);
                }
            }
            if (cfg.model === 'wizard') {
                p('cylinder', cfg.hair, [0, 2.64, -.06], [.88, .10, .86]);
                p('cone', cfg.outfit, [0, 3.02, -.06], [.80, .85, .76], [0, 0, -.12]);
                p('sphere', '#e2d1ff', [.14, 3.29, -.02], [.12, .11, .12]);
            }
            if (cfg.model === 'royal') {
                p('cylinder', '#f1cb60', [0, 2.62, -.02], [.77, .28, .69]);
                for (const s of [-1, 0, 1]) p('cone', '#ffe392', [s * .25, 2.86, -.015], [.22, .34, .21]);
                p('sphere', '#e74e85', [0, 2.78, .35], [.10, .11, .04]);
            }
            if (unicorn) {
                p('cone', '#ffeb9a', [0, 2.73, .22], [.22, .51, .20]);
                for (const s of [-1, 1]) p('cone', '#ffe3f5', [s * .30, 2.53, -.05], [.25, .39, .19]);
            }
            if (isDragon) {
                for (const s of [-1, 1]) {
                    p('wing', '#4abfaa', [s * .50, 1.74, -.34], [s * 1.15, 1.13, .50]);
                    p('cone', '#dbe9a9', [s * .28, 2.54, -.05], [.17, .31, .15]);
                }
                p('sphere', cfg.outfit, [0, .63, -.45], [.20, .20, .47], [.45, 0, 0]);
            }
            if (cfg.model === 'student') p('cube', '#40577a', [0, 1.45, -.40], [.70, .75, .22]);
            if (cfg.model === 'teacher') p('cube', '#f2c878', [-.85, 1.05, .15], [.32, .48, .11], [0, 0, -.25]);
        }
        dispose() {
            this.running = false;
            cancelAnimationFrame(this.frame);
            this.resizeObserver?.disconnect();
            this.canvas.removeEventListener('pointerdown', this.pointerStart);
            this.canvas.removeEventListener('pointermove', this.pointerMove);
            this.canvas.removeEventListener('pointerup', this.pointerEnd);
            this.canvas.removeEventListener('pointercancel', this.pointerEnd);
            this.canvas.removeEventListener('keydown', this.keyDown);
            this.canvas.removeEventListener('webglcontextlost', this.contextLost);
            if (this.gl) {
                for (const mesh of Object.values(this.meshes || {})) {
                    this.gl.deleteBuffer(mesh.vertices); this.gl.deleteBuffer(mesh.indices);
                }
                if (this.program) this.gl.deleteProgram(this.program);
            }
            this.host.replaceChildren();
            delete this.host.dataset.modelId;
            delete this.host.dataset.modelKind;
        }
    }

    const stages = new Map();
    const Character3D = {
        PETS, AVATARS,
        getDefinition(kind, id) { return (kind === 'pet' ? PETS : AVATARS)[id] || null; },
        render(host, options) {
            if (!host || !options || !['pet', 'avatar'].includes(options.kind)) return false;
            const valid = this.getDefinition(options.kind, options.id);
            const resolved = { ...options, id: valid ? options.id : (options.kind === 'pet' ? 'cat' : 'default') };
            const stage = stages.get(host);
            if (stage && stage.options.id === resolved.id && stage.options.kind === resolved.kind) {
                stage.update(resolved); return Boolean(stage.gl && !stage.error);
            }
            if (stage) { stage.dispose(); stages.delete(host); }
            const next = new Stage(host, resolved);
            stages.set(host, next);
            return Boolean((next.gl || next.ctx2d) && !next.error);
        },
        rotate(host, direction) {
            const stage = stages.get(host);
            if (!stage || !Number.isFinite(direction)) return false;
            stage.yaw += clamp(direction, -1, 1) * .38;
            stage.drawNow();
            return true;
        },
        react(host, action = 'play') {
            const stage = stages.get(host);
            if (!stage) return false;
            stage.react(action); return true;
        },
        getStage(host) { return stages.get(host) || null; },
        release(host) {
            const stage = stages.get(host);
            if (!stage) return;
            stage.dispose(); stages.delete(host);
        },
        releaseAll() { for (const host of [...stages.keys()]) this.release(host); },
        get activeCount() { return stages.size; }
    };
    if (typeof window !== 'undefined') window.Character3D = Character3D;
    if (typeof module !== 'undefined' && module.exports) module.exports = Character3D;
})();
