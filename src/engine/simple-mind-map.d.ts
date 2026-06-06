// simple-mind-map ships its JS source (plugins, themes) without type
// declarations. Declare the source subtree as untyped modules so the adapter
// can import plugins and the default theme config. The core package entry
// ('simple-mind-map') keeps its own bundled types.
declare module 'simple-mind-map/src/*'
