# Cómo editar tu sitio

Todo el sitio se maneja con **carpetas de fotos y archivos de texto**. No hay panel ni contraseña del sitio: cambiás un archivo, lo guardás y el sitio se actualiza solo.

## Dónde se edita

**Desde GitHub (computadora o celular)**
1. Entrá a github.com con tu usuario y abrí el repositorio del sitio.
2. Tocá el archivo que querés cambiar y después el lápiz ✎ (*Edit*).
3. Cambiá lo que necesites y tocá **Commit changes**.
4. En uno o dos minutos el cambio está en el sitio. Si no lo ves, recargá la página.

Para **subir fotos**: entrá a la carpeta de la sección, **Add file → Upload files**, arrastrá las fotos y **Commit changes**.

¿Te equivocaste? Cada archivo tiene un botón **History** con todas las versiones anteriores, así que nada se pierde.

## Qué archivo abrir

| Quiero... | Abro... |
|---|---|
| Cambiar el texto de una sección | `contenido/<sección>/texto.txt` |
| Cambiar el título de una sección o sumar un video | `contenido/<sección>/info.txt` |
| Agregar o cambiar fotos | la carpeta `contenido/<sección>/` |
| Cambiar tipografías, colores, el correo o las redes | `config.txt` |

Las secciones son estas carpetas, y cada una es una sílaba de tu nombre, en este orden:

| Sílaba | Carpeta |
|---|---|
| **Pa** | `contenido/01-Perfil` |
| **blo** | `contenido/02-Festivales` |
| **Maz** | `contenido/03-Distribucion` |
| **zo** | `contenido/04-Formacion` |
| **la** | `contenido/05-El-cine-visible` |

## Textos (texto.txt)

Se escribe como un texto común. Hay unas pocas marcas que podés usar:

```
# Título grande

## Subtítulo chico

Un párrafo. Para empezar otro, dejá una línea en blanco.

- Un punto de una lista
- Otro punto

**negrita** y *cursiva* (sirve para títulos de películas)
```

Los enlaces (`https://...`) y los correos se convierten solos en links.

## Título, descripción y video (info.txt)

```
titulo: Festivales
descripcion: Dirección y programación de festivales de cine.
video: https://www.youtube.com/watch?v=XXXXXXXXXXX
```

- **titulo**: el nombre de la sección en el menú y en la portada.
- **descripcion**: una línea. Se usa en Google y al compartir el enlace.
- **video**: un enlace de YouTube o Vimeo. Aparece arriba del texto. Si no querés video, borrá la línea o poné un `#` adelante.

Cada línea tiene la forma `nombre: valor`. Lo único importante es no borrar los dos puntos.

## Fotos

- **La primera foto es la portada** de la sección. Es la que se proyecta en la pantalla de la página de inicio.
- **El orden es por nombre:** `01.jpg`, `02.jpg`, `03.jpg`... Para cambiar el orden, cambiá los números.
- **Tamaño ideal:** entre 1600 y 2000 píxeles del lado más largo, en JPG. Una foto del celular sirve; si pesa más de 1 MB conviene achicarla (por ejemplo en squoosh.app).
- Las fotos que hay ahora son de muestra (dicen "Imagen de muestra"). Reemplazalas subiendo las tuyas con el mismo nombre, o borralas y subí nuevas.
- **Cada sección necesita al menos una foto.** Si una carpeta queda sin fotos, la sección desaparece.

## Tipografías

En `config.txt`:

```
fuente_nombre: Hurricane
fuente_titulos: Hurricane
fuente_texto: Cormorant Garamond
```

- **fuente_nombre**: la del nombre grande de la portada.
- **fuente_titulos**: la de los títulos de las secciones.
- **fuente_texto**: la de los textos y el menú.

Podés usar cualquier tipografía de **fonts.google.com**: copiá el nombre exacto como figura ahí (por ejemplo `Playfair Display`, `Cormorant Garamond`, `Space Mono`).

Para ajustar los tamaños:

```
nombre_tamano: 100
titulos_tamano: 170
```

Están en porcentaje: con `120` se ve un 20% más grande y con `80`, un 20% más chico.

## Colores

```
color_fondo_oscuro: #0d0b0a
color_texto_oscuro: #efe8dc
color_acento: #e9b45f
fondo_colores: #0d0b0a, #140b0c, #0a1114, #120d16, #0d0b0a
```

- **color_acento**: el color de la sílaba encendida, los títulos y los links.
- **fondo_colores**: los colores por los que pasa el fondo de la portada, muy despacio.

Los colores se escriben en código hexadecimal (`#` y seis caracteres). Para elegir uno, buscá "color picker" en Google y copiá el código.

## El nombre y las sílabas

```
nombre: Pa|blo Maz|zo|la
```

La barra `|` marca dónde se corta cada parte que se puede tocar. Si sumás o sacás secciones, ajustá las partes para que coincidan. Por ejemplo, con 2 secciones: `Pablo Mazzola` (una por palabra).

La animación en la que el nombre se escribe letra por letra está dibujada para `Pa|blo Maz|zo|la` con Hurricane. Si cambiás el nombre, cómo se corta o `fuente_nombre`, el sitio sigue funcionando: el nombre aparece con un barrido más simple. Para recuperar la escritura con trazo, pedile a Jean Phillippe Studio que la vuelva a generar.

## Efectos de la portada

En `config.txt` se prenden con `si` y se apagan con `no`:

| Opción | Qué hace |
|---|---|
| `intro` | Animación de entrada: el nombre se escribe letra por letra y va a la esquina |
| `proyector` | Al pasar el mouse por una sílaba, proyecta la portada de su sección |
| `recorrido` | Si nadie toca nada, el nombre va señalando sus secciones solo |
| `grano` | El grano de película del fondo |
| `nombre_pista` | El texto chico "tocá una sílaba" (dejalo vacío para sacarlo) |

## Contacto y redes

```
email: tucorreo@dominio.com
instagram: tuusuario
youtube:
linkedin:
```

Lo que quede vacío no aparece en el sitio.

## Lo que no conviene tocar

- La carpeta `assets/` y el archivo `index.html`. Son el funcionamiento del sitio.
- Los nombres de las claves (lo que está antes de los dos puntos). Se cambia solo lo que está después.

## Si algo se ve mal

1. Volvé al último archivo que cambiaste y fijate que cada línea tenga sus dos puntos.
2. En GitHub, en **History**, podés volver a la versión anterior.
3. Si no sale, escribile a Jean Phillippe Studio: jeanphillippe.com
