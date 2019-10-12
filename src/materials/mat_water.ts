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
    #define TAU 6.28318530718
    #define MAX_ITER 5

    precision mediump float;

    uniform vec4 color;
    uniform int light_count;
    uniform vec3 light_positions[10];
    uniform vec4 light_details[10];
    uniform float iTime;
    uniform vec2 iResolution;

    in vec4 vert_pos;
    in vec3 vert_normal;
    out vec4 frag_color;

    void main() {
        float time = iTime * .5+23.0;
        // uv should be the 0-1 uv of texture...
        vec2 uv = vert_pos.xy / iResolution.xy;


        vec2 p = mod(uv*TAU, TAU)-250.0;

        vec2 i = vec2(p);
        float c = 1.0;
        float inten = .005;

        for (int n = 0; n < MAX_ITER; n++)
        {
            float t = time * (1.0 - (3.5 / float(n+1)));
            i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
            c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
        }
        c /= float(MAX_ITER);
        c = 1.17-pow(c, 1.4);
        vec3 o_color = vec3(pow(abs(c), 8.0));
        o_color = clamp(o_color + vec3(0.0, 0.35, 0.5), 0.0, 1.0);

        vec3 rgb = vec3(0.0, 0.0, 0.0);
        vec3 frag_normal = normalize(vert_normal);
        for (int i = 0; i < light_count; i++) {
            vec3 light_dir = light_positions[i] - vert_pos.xyz;
            vec3 light_normal = normalize(light_dir);
            float light_dist = length(light_dir);

            float diffuse_factor = max(dot(frag_normal, light_normal), 0.0);
            float distance_factor = light_dist * light_dist;
            float intensity_factor = light_details[i].a;

            rgb += o_color.rgb * light_details[i].rgb * diffuse_factor
                    * intensity_factor / distance_factor;
        }

        frag_color = vec4(rgb, 1.0);
    }
`;

export function mat_water(gl: WebGL2RenderingContext) {
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
        "iResolution",
    ]) {
        material.Uniforms.push(gl.getUniformLocation(material.Program, name)!);
    }

    return material;
}
