/* Adds the standard "this is going away" headers to a response.
   Deprecation: true                          -> this endpoint is deprecated
   Sunset: <HTTP date>                        -> when it will stop working
   Link: <successor>; rel="successor-version" -> where to go instead */

// ONE place to change the v1 shutdown date. The tests and the headers both read it.
const V1_SUNSET = process.env.V1_SUNSET || "2026-11-13";

function deprecated({ sunset, successor }) {
    return (req, res, next) => {
        res.set("Deprecation", "true");
        res.set("Sunset", new Date(sunset).toUTCString());
        res.set("Link", `<${successor}>; rel="successor-version"`);
        next();
    };
}

module.exports = { deprecated, V1_SUNSET };
