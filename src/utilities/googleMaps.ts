import { Loader } from "@googlemaps/js-api-loader";

    let map: any;
    const additionalOptions = {};
    const loader = new Loader({
        apiKey: "AIzaSyA9Xy7PrYo6nQtX2AVwDPsUcY5PoOpNoIk",
        version: "weekly",
        ...additionalOptions,
    });
    const data: any = document.querySelector("[data-message]")?.getAttribute("data-message");
    const decoded = JSON.parse(data);

    loader.load().then(async (google) => {
        const { Map } = await google.maps.importLibrary("maps");
        const mapsOptions = {
            zoom: 2,
            center: { lat: 47.142198, lng: 1.080505 },
            clickableIcons: false,
            disableDefaultUI: true,
            styles: [
                { featureType: "all", elementType: "geometry.fill", stylers: [{ weight: "2.00" }] },
                { featureType: "all", elementType: "geometry.stroke", stylers: [{ color: "#9c9c9c" }] },
                { featureType: "all", elementType: "labels.text", stylers: [{ visibility: "on" }] },
                { featureType: "landscape", elementType: "all", stylers: [{ color: "#f2f2f2" }] },
                { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
                { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
                { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
                { featureType: "road", elementType: "all", stylers: [{ saturation: -100 }, { lightness: 45 }] },
                { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#eeeeee" }] },
                { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7b7b7b" }] },
                { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
                { featureType: "road.highway", elementType: "all", stylers: [{ visibility: "simplified" }] },
                { featureType: "road.arterial", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
                { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
                { featureType: "water", elementType: "all", stylers: [{ color: "#46bcec" }, { visibility: "on" }] },
                { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#c8d7d4" }] },
                { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#070707" }] },
                { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
            ],
        };

        map = new Map(document.getElementById("map"), mapsOptions);

        let marker;
        decoded.map((item: any) => (marker = new google.maps.Marker({position: new google.maps.LatLng(item.lat, item.lng),map: map,})),);
    });