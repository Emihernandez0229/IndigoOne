export const MAX_PRODUCT_PHOTOS = 3;

export const ACCEPTED_PHOTO_TYPES = ["image/png", "image/jpeg"];

export const PRODUCT_TYPES = [
  { value: "armazones", label: "Armazones" },
  { value: "micas", label: "Micas" },
];

export const GENDERS = [
  { value: "hombre", label: "Hombre" },
  { value: "mujer", label: "Mujer" },
  { value: "unisex", label: "Unisex" },
];

export const MATERIALS_BY_TYPE = {
  armazones: [
    "OKI Eyewear",
    "JD Sport",
    "Friend",
    "Liam",
    "Life",
    "JM",
    "Cactus",
    "Eclipse",
    "Fashion",
    "Mar",
    "Toki Kids",
  ].map((label) => ({ value: label, label })),

  micas: [
    "Progresivos Superfit",
    "Photoflux",
    "Resistant Flex",
    "Antibue Premium",
  ].map((label) => ({ value: label, label })),
};

export const ALL_MATERIALS = [
  ...MATERIALS_BY_TYPE.armazones,
  ...MATERIALS_BY_TYPE.micas,
];

export const INVENTORY_STOCK_STATUSES = [
  { value: "available", label: "Disponible" },
  { value: "low_stock", label: "Bajo stock" },
  { value: "out_of_stock", label: "Agotado" },
];

export const INVENTORY_STATUSES = [
  ...INVENTORY_STOCK_STATUSES,
  { value: "inactive", label: "Inactivo" },
];
