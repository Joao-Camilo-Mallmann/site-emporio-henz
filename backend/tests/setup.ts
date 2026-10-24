// Carregado antes dos testes (bunfig.toml). O env.ts exige JWT_SECRET no import,
// então a suíte define um segredo próprio quando o ambiente não traz um.
process.env.JWT_SECRET ||= "segredo-de-teste-com-pelo-menos-32-caracteres";
