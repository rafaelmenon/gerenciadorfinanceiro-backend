/**
 * Formata uma data para o formato dd/mm/yyyy
 * @param date Data a ser formatada
 * @returns String formatada no padrão dd/mm/yyyy
 */
export function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Retorna o nome do mês em português
 * @param month Número do mês (1-12)
 * @returns Nome do mês em português
 */
export function getMonthName(month: number): string {
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  // Ajustar índice (meses em JS são 0-11, mas nossa função recebe 1-12)
  return monthNames[month - 1] || "";
}
