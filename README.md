# Pablo Mazzola · propuesta de sitio (Rider7)

Sitio estático hecho con **Rider7** y una capa de tema propia (`assets/mazzola.css` y `assets/mazzola.js`). No usa Node ni hay que compilar nada.

## Cómo funciona

- **Portada:** solo el nombre, en la esquina inferior derecha, con la tipografía Hurricane. La primera vez que se abre el sitio hay una intro corta: destello de proyector, el nombre se escribe en el centro y se acomoda en la esquina. Tocando la pantalla o una tecla se saltea.
- **Cada sílaba abre una sección.** Al pasar el mouse se ve el nombre de la sección y su imagen de fondo, desenfocada. Si nadie toca nada, el nombre va mostrando sus secciones de a una.
- **Al entrar a una sección** hay una transición de iris (el círculo del cine mudo) y se ve el libro de imágenes de Rider7, con el texto y el video debajo.
- **El fondo** es oscuro y cambia de color despacio. Los colores se eligen en `config.txt`.

## Editar el contenido

Todo se edita con archivos de texto y carpetas de imágenes, igual que en Rider7.

```
contenido/
├── 01-Perfil/            ← sílaba 1 (Pa)
│   ├── 01.jpg            ← la primera imagen es la portada
│   ├── 02.jpg ...
│   ├── info.txt          ← título, descripción y video
│   └── texto.txt         ← el texto de la sección
├── 02-Festivales/        ← sílaba 2 (blo)
├── 03-Distribucion/      ← sílaba 3 (Maz)
├── 04-Formacion/         ← sílaba 4 (zo)
└── 05-El-cine-visible/   ← sílaba 5 (la)
```

- **El orden de las carpetas es el orden de las sílabas.** Para cambiar qué abre cada sílaba, se cambia el número del principio de la carpeta.
- Cada sección necesita **al menos una imagen**. Las imágenes de ahora son de muestra: se reemplazan por fotos, afiches o fotogramas (entre 1600 y 2000 px del lado más largo, JPG calidad 80).
- Para ocultar una sección sin borrarla, se le pone `_` adelante al nombre de la carpeta.

### info.txt

```
titulo: Festivales
menu: Festivales
descripcion: Dirección y programación de festivales de cine.
video: https://www.youtube.com/watch?v=XXXXXXXXXXX
```

`video` acepta enlaces de YouTube o Vimeo y aparece arriba del texto.

### texto.txt

Texto común, con estas marcas opcionales:

```
# Título grande

## Subtítulo

Un párrafo. Una línea en blanco separa párrafos.
Los enlaces (https://...) y los correos se detectan solos.
**negrita** y *cursiva* (útil para títulos de películas).

- Un ítem de lista
- Otro ítem
```

Si una sección no tiene `texto.txt` ni video, se ve solo el libro de imágenes.

## config.txt

Arriba de todo está el bloque de la portada:

| Clave | Qué hace |
|---|---|
| `nombre` | El nombre, con `\|` donde se corta cada sílaba. `Pa\|blo Maz\|zo\|la` son 5 partes. Para letras: `P\|a\|b\|l\|o`. Para palabras: `Pablo Mazzola` |
| `nombre_tamano` | Tamaño del nombre en porcentaje (100 = normal) |
| `nombre_pista` | Texto chico debajo del nombre (vacío = no aparece) |
| `intro` | Animación de entrada: `si` o `no` |
| `fondo_colores` | Colores del fondo, separados por coma |
| `fondo_ciclo` | Segundos que tarda en recorrerlos |
| `grano` | Grano de película en la portada: `si` o `no` |
| `recorrido` | El nombre muestra sus secciones solo cuando nadie lo toca: `si` o `no` |

El resto de las claves son las de Rider7 (colores, tipografías, contacto, SEO, de dónde salen las imágenes). **Falta completar el correo real** en `email`.

## Probar y publicar

Igual que Rider7: en la Terminal, dentro de esta carpeta, `python3 -m http.server 8080` y abrir `http://localhost:8080`. Para publicar en Cloudflare Pages, subir la carpeta a un repositorio público de GitHub y completar `github_repositorio` en `config.txt`.

`app.js` y `app.css` son los de Rider7 sin cambios: si Rider7 se actualiza, se pueden reemplazar sin tocar el tema.

## Créditos

- Tipografía Hurricane, licencia SIL Open Font License (`assets/fonts/OFL.txt`).
- Efecto de hojas: StPageFlip (MIT).
