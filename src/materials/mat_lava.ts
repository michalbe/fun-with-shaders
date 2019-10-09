import {ShadedAttribute} from "../components/com_render_shaded.js";
import {GL_TRIANGLES} from "../webgl.js";
import {link, Material} from "./mat_common.js";

let vertex = `#version 300 es
    uniform mat4 pv;
    uniform mat4 world;
    uniform mat4 self;

    layout(location=${ShadedAttribute.Position}) in vec3 position;
    layout(location=${ShadedAttribute.Normal}) in vec3 normal;
    out vec4 vert_pos;
    out vec3 vert_normal;

    void main() {
        vert_pos = world * vec4(position, 1.0);
        vert_normal = (vec4(normal, 1.0) * self).xyz;
        gl_Position = pv * vert_pos;
    }
`;

let fragment = `#version 300 es
    precision mediump float;

    uniform vec4 color;
    uniform int light_count;
    uniform vec3 light_positions[10];
    uniform vec4 light_details[10];
    uniform float iTime;

    in vec4 vert_pos;
    in vec3 vert_normal;
    out vec4 frag_color;

    vec2 iResolution = vec2(2.0, 2.0);

    vec2 hash( vec2 x )
    {
        const vec2 k = vec2( 0.9183099, 0.2678794 );
        x = x*k + k.yx;
        return -1.0 + 2.0*fract( 16.0 * k*fract( x.x*x.y*(x.x+x.y)) );
    }

    float noise( in vec2 p )
    {
        vec2 i = floor( p );
        vec2 f = fract( p );
        vec2 u = f*f*(3.0-2.0*f);
        float n =  mix( mix( dot( hash( i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                        dot( hash( i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                    mix( dot( hash( i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                        dot( hash( i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
        return 0.5 + 0.5*n;
    }

    float noise2(vec2 uv)
    {
        float color;
        color += smoothstep(.1,.5,noise(uv)); // Black splatter
        color -= smoothstep(.1,.8,noise(uv)); // Holes on splatter
        return color/2.;
    }

    void main() {
        vec3 rgb = vec3(0.0, 0.0, 0.0);
        vec3 frag_normal = normalize(vert_normal);

        vec2 uv = (vert_pos.xy/iResolution.xy) + vec2(-iTime/200.,0);

        float time = iTime*5.;
        vec2 uv1 = uv*8.;
        float rand = noise(uv1+vec2(time));
        rand += noise(uv1+vec2(-time));
        rand += noise(uv1+vec2(time, -time));
        rand += noise(uv1+vec2(-time, time));
        rand += noise(uv1+vec2(time, 0.));
        rand += noise(uv1+vec2(-time, 0.));
        rand += noise(uv1+vec2(0., -time));
        rand += noise(uv1+vec2(0., time));

        rand /= 16.;

        float colR = smoothstep(clamp(0.25+rand,0.,1.), clamp(0.7, 0., 1.), noise(uv*32.)+noise2(uv*8.));
        rand /= 4.;
        float colG = smoothstep(clamp(0.5+rand,0.,1.), clamp(1., 0., 1.), noise(uv*32.)+noise2(uv*8.));
        vec3 o_color = vec3(colR,colG,(colG+colR)/10.);

        frag_color = vec4(o_color, 1.0);
    }
`;

export function mat_lava(gl: WebGL2RenderingContext) {
    let material = <Material>{
        Mode: GL_TRIANGLES,
        Program: link(gl, vertex, fragment),
        Uniforms: [],
    };

    for (let name of [
        "pv",
        "world",
        "self",
        "color",
        "light_count",
        "light_positions",
        "light_details",
        "iTime",
    ]) {
        material.Uniforms.push(gl.getUniformLocation(material.Program, name)!);
    }

    return material;
}
