/*jslint es5: true */
/*jslint nomen: true */
/*global $*/
/*global google*/
/*global grecaptcha*/

var URL_Peticiones = "https://menucr-jeancarlozuniga17.c9users.io/src";
var URL_Peticiones = "http://127.0.0.1";
var captchaIncompleto = true;
var sidebar = $('#sidebar').sidebar();
var map;
var infoWindow;
var actualSeleccionMenu;
var marcadores = [];
var menusSodaEscogida = [];
var sodas_listado;

// ========== FUNCIONES ENVÏO MENSAJES ==========

function enviarPeticion(idSoda, form) {
    "use strict";
    $.ajax({
        method: 'POST',
        data: {
            name: $('#mensaje-nombre').val(),
            email: $('#mensaje-email').val(),
            body: $('#mensaje-cuerpo').val(),
            recaptchaResponse: grecaptcha.getResponse()
        },
        accepts: {
            json: 'application/json'
        },
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        url: URL_Peticiones + "/restaurants/sendEmail/" + idSoda
    }).done(function (json) {
        console.log(json);
        if (json.code && json.code === 404) {
            $('#mensajes-alertas').html('<div class="alert alert-success"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>Soda no existente</div>');
        } else if (json.respuesta.Exito) {
            $('#mensajes-alertas').html('<div class="alert alert-success"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>Enviado con exito</div>');
            form.reset();
            grecaptcha.reset();
        } else {
            var error = [];
            if (json.respuesta.name) {
                error.push("El campo nombre es requerido");
            }
            if (json.respuesta.email) {
                if (json.respuesta.email.validFormat) {
                    error.push("El email indicado es inválido");
                } else {
                    error.push("El campo email es requerido");
                }
            }
            if (json.respuesta.body) {
                error.push("El campo mensaje es requerido");
            }
            if (json.respuesta.captcha) {
                error.push("Error con el captcha enviado");
                grecaptcha.reset();
            }
            error = error.join('<br>');
            $('#mensajes-alertas').html('<div class="alert alert-danger"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + error + '</div>');
            
        }
    });
}

function validarYEnviarMensaje(form) {
    "use strict";
    $('#mensajes-alertas').html('');
    if (captchaIncompleto) {
        document.getElementById('alertaCaptcha').style.display = 'block';
    } else {
        enviarPeticion(form.getAttribute('data-idsoda'), form);
    }
    return false;
}

function ocultarErrorCaptcha() {
    "use strict";
    captchaIncompleto = false;
    document.getElementById('alertaCaptcha').style.display = 'none';
}

function captchaExpirado() {
    "use strict";
    captchaIncompleto = true;
}

// ========== FIN FUNCIONES ENVÍO MENSAJES ==========

// ========== FUNCIONES SELECCION DE SODA ==========

function cambiarInformacionSoda(id, indice) {
    "use strict";
    $('#form-enviar')[0].setAttribute('data-idsoda', id);
    $.ajax({
        accepts: {
            json: 'application/json'
        },
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        url: URL_Peticiones + "/restaurants/getMenus/" + id
    }).done(function (data) {
        var infoSodaEscogida, cadena, clasesMenu, textoInfo, categoria, menu = data.menus;
        menusSodaEscogida = [];
        infoSodaEscogida = sodas_listado[indice];
        $('#opciones-soda li').each(function () {
            $(this).removeClass('disabled');
        });
        $('.nombre-soda-actual').each(function () {
            $(this).text(infoSodaEscogida.name);
        });
        textoInfo = (infoSodaEscogida.image_name !== "") ? "<img id='imagen_soda' class='center-block img-thumbnail' alt='imagen " + infoSodaEscogida.name + "' src='" + infoSodaEscogida.image_name + "' /></div>" : "";
        if (infoSodaEscogida.card) {
            textoInfo += "<p>Se acepta tarjeta de crédito o débito</p>";
        } else {
            textoInfo += "<p>No se acepta tarjeta de crédito o débito</p>";
        }
        textoInfo += "El horario es: " + infoSodaEscogida.schedule;
        $('#informacion-soda > div').html(textoInfo);

        $(menu).each(function () {
            cadena = "<tr>";
            cadena += "<td>" + this.name + "</td>";
            cadena += "<td>" + this.dishe.name + "</td>";
            cadena += "<td>" + this.price + "</td>";
            cadena += "</tr>";
            if (!menusSodaEscogida[this.type.type]) {
                menusSodaEscogida[this.type.type] = {
                    'datos': ''
                };
            }
            menusSodaEscogida[this.type.type].datos += cadena;
            menusSodaEscogida[this.type.type].horario = this.type.schedule;
        });
        clasesMenu = '<ul class="nav nav-tabs" id="lista-clases-menu">';

        for (categoria in menusSodaEscogida) {
            if (menusSodaEscogida.hasOwnProperty(categoria)) {
                clasesMenu += '<li role="presentation" onclick="cambioMenu(\'' + categoria + '\', this)"><a href="#">' + categoria + '</a></li>';
                menusSodaEscogida[categoria] = "<div>Horario: " + menusSodaEscogida[categoria].horario + "</div>" + "<table class='table'><thead><th>Tipo</th><th>Nombre</th><th>Precio</th></thead>" + "<tbody>" + menusSodaEscogida[categoria].datos + "</tbody>";
            }
        }
        clasesMenu += "</ul><div id='horario-soda'></div>";
        $('#menu-soda > div').html(clasesMenu);
        actualSeleccionMenu = $('#lista-clases-menu li')[0];
        actualSeleccionMenu.click();
    });
}

function cambioMenu(index, nuevo) {
    "use strict";
    actualSeleccionMenu.classList.remove('active');
    nuevo.classList.add('active');
    actualSeleccionMenu = nuevo;
    $('#horario-soda').html(menusSodaEscogida[index]);
}

function clickMarcador(id, cerrar) {
    "use strict";
    if (cerrar) {
        sidebar.close();
    }
    google.maps.event.trigger(marcadores[id], 'click');
}

function insertarSodas(idSede) {
    "use strict";
    var listaSodasHTML;
    $.ajax({
        accepts: {
            json: 'application/json'
        },
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        url: URL_Peticiones + "/restaurants/indexByHeadquarter/" + idSede
    }).done(function (data) {
        sodas_listado = data.restaurants;
        listaSodasHTML = "<div class='wrapper-list'>";
        $(sodas_listado).each(function (index) {
            var html, point, label, marker, nId = this.id;
            html = "<b>" + this.name + "</b> <br/>" + "<a href=\"javascript:sidebar.open('informacion-soda')\">Ver mas info</a>";
            point = new google.maps.LatLng(this.x, this.y);
            marker = new google.maps.Marker({
                map: map,
                position: point,
                title: this.name
            });
            marcadores[nId] = marker;
            google.maps.event.addListener(marker, 'click', function () {
                $('#mensajes-alertas').html('');
                infoWindow.setContent(html);
                infoWindow.open(map, marker);
                map.panTo(point);
                cambiarInformacionSoda(nId, index);
            });
            listaSodasHTML += "<div class='thumbnail'><div class='content-t'><div class='contenedor-nombre'><p>" + this.name +
                '</p></div>\
                        <div class="btn-group">\
                          <button type="button" class="btn btn-info" onclick="clickMarcador(' + nId + ', true)">Ver en el mapa</button>\
                          <button type="button" class="btn btn-info dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">\
                            <span class="caret"></span>\
                            <span class="sr-only">Toggle Dropdown</span>\
                          </button>\
                          <ul class="dropdown-menu">\
                            <li><a href="#" onclick="clickMarcador(' + this.id + ', false);sidebar.open(\'informacion-soda\');">Ver Información</a></li>\
                            <li><a href="#" onclick="clickMarcador(' + this.id + ', false);sidebar.open(\'menu-soda\');">Ver menú del día</a></li>\
                            <li><a href="#" onclick="clickMarcador(' + this.id + ', false);sidebar.open(\'mensaje-soda\');">Enviar mensaje</a></li>\
                          </ul>\
                        </div></div></div>';
        });
        listaSodasHTML += "</div>";
        $('#lista-sodas > div').html(listaSodasHTML);
    });
}

// ========== FIN FUNCIONES SELECCION DE SODA ==========


// ========== FUNCIONES SELECCION DE SEDE ==========

function cambiar_sede(id, lat, long, nombre) {
    "use strict";
    var point = new google.maps.LatLng(lat, long);
    map.setCenter(point);
    document.getElementById('nombre-sede').textContent = nombre;
    document.getElementById('div_sedes').style.display = "none";
    infoWindow.close();
    google.maps.event.trigger(infoWindow, 'closeclick');
    insertarSodas(id);
}

function cancelar() {
    "use strict";
    //Vuelve a ser seleccionable la opcion de cambiar
    document.getElementById('cambia_sedeBTN').disabled = false;
    document.getElementById('div_sedes').style.display = "none";
}

function mostrarSedes() {
    "use strict";
    document.getElementById('div_sedes').style.display = "block";
    document.getElementById('cambia_sedeBTN').disabled = false;
}

function recuperarSedes() {
    "use strict";
    var boton, i;
    $.ajax({
        accepts: {
            json: 'application/json'
        },
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        url: URL_Peticiones + "/headquarters/"
    }).done(function (json) {
        var div_opciones_sodas = document.createElement('div');
        div_opciones_sodas.id = "div_sedes";
        div_opciones_sodas.style.display = "none";
        div_opciones_sodas.innerHTML = "<br>";

        //Se recorre el json para obtener sus valores
        for (i = 0; i < json.headquarters.length; i += 1) {
            boton = '<div><button class="btn btn-info btn-md" onclick="cambiar_sede(' + json.headquarters[i].id + ',' + json.headquarters[i].x + ',' + json.headquarters[i].y + ', \'' + json.headquarters[i].name + '\');">' + json.headquarters[i].name + '</button></div><br>';
            div_opciones_sodas.innerHTML += boton;
        }
        //Se agrega el boton de cancelar
        boton = '<button class="btn btn-default" onclick="cancelar();">Cancelar</button>';
        div_opciones_sodas.innerHTML += boton;
        document.getElementById('ajustes').appendChild(div_opciones_sodas);
    });

}

// ========== FIN FUNCIONES SELECCION DE SEDE ==========



function initialize() {
    "use strict";
    recuperarSedes();
    map = new google.maps.Map(document.getElementById("map"), {
        center: new google.maps.LatLng(9.936336777937717, -84.05115959657292),
        zoom: 17,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        clickableIcons: false
    });
    infoWindow = new google.maps.InfoWindow();
    google.maps.event.addListener(infoWindow, 'closeclick', function () {
        sidebar.close();
        $('#opciones-soda li').each(function () {
            $(this).addClass('disabled');
        });
    });
    google.maps.event.addListener(map, 'click', function (event) {
        infoWindow.close();
        google.maps.event.trigger(infoWindow, 'closeclick');
    });

}