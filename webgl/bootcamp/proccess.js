// Add normal map in the stealth.json

var fs = require('fs');

var jsonStr = fs.readFileSync('assets/prop_battleBus.json', 'utf-8');
var json = JSON.parse(jsonStr);

for (var imageName in json.images) {
    var path = json.images[imageName].path;
    if (path.match(/_nrm.png$/)) {
        var diffusePath = path.replace(/_nrm.png/, '_dff.png');

        var matName = findMaterial(diffusePath);

        if (matName) {
            json.materials[matName].instanceTechnique.values.normalMap = createTexture(imageName);
        }
    }
}

fs.writeFileSync('assets/prop_battleBus_nrm.json', JSON.stringify(json, null, 4), 'utf-8');

function createTexture(imageName) {
    for (var name in json.textures) {
        if (json.textures[name].source === imageName) {
            return name;
        }
    }
    json.textures['texture_' + imageName] = {
        format: 6408,
        internalFormat: 6408,
        sampler: "sampler_0",
        source: imageName,
        target: 3553
    }

    return 'texture_' + imageName;
}

function findMaterial(diffusePath) {
    for (var name in json.materials) {
        var mat = json.materials[name];

        var values = mat.instanceTechnique.values;

        if (typeof values.diffuse === 'string') {
            var texture = json.textures[values.diffuse];

            if (texture) {
                var imageName = texture.source;
                if (json.images[imageName].path === diffusePath) {
                    return name;
                }
            }
        }
    }
}