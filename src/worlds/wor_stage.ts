import {create_fly_camera} from "../blueprints/blu_fly_camera.js";
import {light} from "../components/com_light.js";
import {render_shaded} from "../components/com_render_shaded.js";
import {Game} from "../game.js";
import {Mat} from "../materials/mat_index.js";
import {Icosphere} from "../shapes/Icosphere.js";

export function world_stage(game: Game) {
    game.World = [];
    game.Cameras = [];
    game.Lights = [];
    game.GL.clearColor(0.0, 0.0, 0.0, 1);

    // Player-controlled camera.
    game.Add({
        Translation: [0, 0, 3],
        ...create_fly_camera(game),
    });

    // Light and audio source.
    game.Add({
        Translation: [0, 3, 5],
        Using: [light([1, 1, 1], 5)],
    });

    game.Add({
        Translation: [-1, 0, 0],
        Using: [render_shaded(game.Materials[Mat.Lava], Icosphere, [1, 1, 0.3, 1])],
    });

    game.Add({
        Translation: [1, 0, 0],
        Using: [render_shaded(game.Materials[Mat.Water], Icosphere, [1, 1, 0.3, 1])],
    });
}
