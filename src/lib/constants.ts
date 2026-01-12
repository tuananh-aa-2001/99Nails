export const SERVICES = [
    {
        id: 'neumodellage',
        name: 'Neumodellage inkl. French Weiß oder Farbe',
        duration: 90,
        price: 60 // Example price
    },
    {
        id: 'auffuellen',
        name: 'Auffüllen',
        subcategories: [
            { id: 'auffuellen-babyboomer', name: 'Babyboomer', duration: 75, price: 45 },
            { id: 'auffuellen-natur', name: 'Natur', duration: 60, price: 40 },
            { id: 'auffuellen-french', name: 'mit French/Farbe', duration: 75, price: 45 },
        ]
    },
    {
        id: 'abloesen',
        name: 'Ablösen der Nagelmodellage',
        subcategories: [
            { id: 'abloesen-gel', name: 'Gel', duration: 30, price: 15 },
            { id: 'abloesen-acyl', name: 'Acyl', duration: 45, price: 20 },
        ]
    },
    {
        id: 'manikuere',
        name: 'Maniküre',
        subcategories: [
            { id: 'manikuere-lack', name: 'mit klarlack/Nagellack', duration: 45, price: 25 },
        ]
    },
    {
        id: 'pedikuere',
        name: 'Pediküre (Fußbad, Hornhautentfernung, Massage)',
        subcategories: [
            { id: 'pedikuere-lack', name: 'mit klarlack/Nagellack', duration: 60, price: 35 },
            { id: 'pedikuere-french', name: 'mit French', duration: 75, price: 40 },
        ]
    },
];

export const SERVICE_COLORS: { [key: string]: { bg: string; border: string } } = {
    'neumodellage': { bg: '#d4af37', border: '#b08d26' }, // Gold
    'auffuellen': { bg: '#FF6B9D', border: '#e05a8a' }, // Dusty Rose
    'abloesen': { bg: '#1a1a1a', border: '#000000' }, // Dark/Black
    'manikuere': { bg: '#8e44ad', border: '#7d3c98' }, // Purple
    'pedikuere': { bg: '#2980b9', border: '#2471a3' }, // Blue
};
