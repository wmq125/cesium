/*global define*/
define([
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/Cartesian4',
        '../Core/Color',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Core/Matrix2',
        '../Core/Matrix3',
        '../Core/Matrix4',
        '../Core/RuntimeError'
    ], function(
        Cartesian2,
        Cartesian3,
        Cartesian4,
        Color,
        defined,
        defineProperties,
        DeveloperError,
        Matrix2,
        Matrix3,
        Matrix4,
        RuntimeError) {
    "use strict";
    /*global console*/

    /**
     * @private
     */
    var Uniform = function(gl, activeUniform, uniformName, location) {
        // PERFORMANCE_IDEA: the type of value and _value depend on the
        // uniform's type.  We should have a different class per type,
        // not just change the set function depending on the type.
        this.value = undefined;
        this._value = undefined;

        var type = activeUniform.type;

        this._gl = gl;
        this._type = type;
        this._name = uniformName;
        this._location = location;

        /**
         * @private
         */
        this.textureUnitIndex = undefined;

        var set;
        switch (type) {
            case gl.FLOAT:
                set = this.setFloat;
                break;
            case gl.FLOAT_VEC2:
                set = this.setFloatVec2;
                break;
            case gl.FLOAT_VEC3:
                set = this.setFloatVec3;
                break;
            case gl.FLOAT_VEC4:
                set = this.setFloatVec4;
                break;
            case gl.SAMPLER_2D:
            case gl.SAMPLER_CUBE:
                set = this.setSampler;
                break;
            case gl.INT:
            case gl.BOOL:
                set = this.setInt;
                break;
            case gl.INT_VEC2:
            case gl.BOOL_VEC2:
                set = this.setIntVec2;
                break;
            case gl.INT_VEC3:
            case gl.BOOL_VEC3:
                set = this.setIntVec3;
                break;
            case gl.INT_VEC4:
            case gl.BOOL_VEC4:
                set = this.setIntVec4;
                break;
            case gl.FLOAT_MAT2:
                set = this.setMat2;
                break;
            case gl.FLOAT_MAT3:
                set = this.setMat3;
                break;
            case gl.FLOAT_MAT4:
                set = this.setMat4;
                break;
            default:
                throw new RuntimeError('Unrecognized uniform type: ' + type + ' for uniform "' + uniformName + '".');
        }

        this._set = set;

        if ((type === gl.SAMPLER_2D) || (type === gl.SAMPLER_CUBE)) {
            this._setSampler = function(textureUnitIndex) {
                this.textureUnitIndex = textureUnitIndex;
                gl.uniform1i(location, textureUnitIndex);
                return textureUnitIndex + 1;
            };
        }
    };

    defineProperties(Uniform.prototype, {
        name : {
            get : function() {
                return this._name;
            }
        },
        datatype : {
            get : function() {
                return this._type;
            }
        }
    });

    Uniform.prototype.setFloat = function() {
        if (this.value !== this._value) {
            this._value = this.value;
            this._gl.uniform1f(this._location, this.value);
        }
    };

    Uniform.prototype.setFloatVec2 = function() {
        var v = this.value;
        if (!Cartesian2.equals(v, this._value)) {
            this._value = Cartesian2.clone(v, this._value);
            this._gl.uniform2f(this._location, v.x, v.y);
        }
    };

    Uniform.prototype.setFloatVec3 = function() {
        var v = this.value;

        if (defined(v.red)) {
            if (!Color.equals(v, this._value)) {
                this._value = Color.clone(v, this._value);
                this._gl.uniform3f(this._location, v.red, v.green, v.blue);
            }
        } else if (defined(v.x)) {
            if (!Cartesian3.equals(v, this._value)) {
                this._value = Cartesian3.clone(v, this._value);
                this._gl.uniform3f(this._location, v.x, v.y, v.z);
            }
        } else {
            throw new DeveloperError('Invalid vec3 value for uniform "' + this._activethis.name + '".');
        }
    };

    Uniform.prototype.setFloatVec4 = function() {
        var v = this.value;

        if (defined(v.red)) {
            if (!Color.equals(v, this._value)) {
                this._value = Color.clone(v, this._value);
                this._gl.uniform4f(this._location, v.red, v.green, v.blue, v.alpha);
            }
        } else if (defined(v.x)) {
            if (!Cartesian4.equals(v, this._value)) {
                this._value = Cartesian4.clone(v, this._value);
                this._gl.uniform4f(this._location, v.x, v.y, v.z, v.w);
            }
        } else {
            throw new DeveloperError('Invalid vec4 value for uniform "' + this._activethis.name + '".');
        }
    };

    Uniform.prototype.setSampler = function() {
        var gl = this._gl;
        gl.activeTexture(gl.TEXTURE0 + this.textureUnitIndex);
        gl.bindTexture(this.value._target, this.value._texture);
    };

    Uniform.prototype.setInt = function() {
        if (this.value !== this._value) {
            this._value = this.value;
            this._gl.uniform1i(this._location, this.value);
        }
    };

    Uniform.prototype.setIntVec2 = function() {
        var v = this.value;
        if (!Cartesian2.equals(v, this._value)) {
            this._value = Cartesian2.clone(v, this._value);
            this._gl.uniform2i(this._location, v.x, v.y);
        }
    };

    Uniform.prototype.setIntVec3 = function() {
        var v = this.value;
        if (!Cartesian3.equals(v, this._value)) {
            this._value = Cartesian3.clone(v, this._value);
            this._gl.uniform3i(this._location, v.x, v.y, v.z);
        }
    };

    Uniform.prototype.setIntVec4 = function() {
        var v = this.value;
        if (!Cartesian4.equals(v, this._value)) {
            this._value = Cartesian4.clone(v, this._value);
            this._gl.uniform4i(this._location, v.x, v.y, v.z, v.w);
        }
    };

    Uniform.prototype.setMat2 = function() {
        if (!defined(this._value)) {
            this._value = new Float32Array(4);
        }

        if (!Matrix2.equalsArray(this.value, this._value, 0)) {
            Matrix2.toArray(this.value, this._value);
            this._gl.uniformMatrix2fv(this._location, false, this._value);
        }
    };

    Uniform.prototype.setMat3 = function() {
        if (!defined(this._value)) {
            this._value = new Float32Array(9);
        }

        if (!Matrix3.equalsArray(this.value, this._value, 0)) {
            Matrix3.toArray(this.value, this._value);
            this._gl.uniformMatrix3fv(this._location, false, this._value);
        }
    };

    Uniform.prototype.setMat4 = function() {
        if (!defined(this._value)) {
            this._value = new Float32Array(16);
        }

        if (!Matrix4.equalsArray(this.value, this._value, 0)) {
            Matrix4.toArray(this.value, this._value);
            this._gl.uniformMatrix4fv(this._location, false, this._value);
        }
    };

    return Uniform;
});
