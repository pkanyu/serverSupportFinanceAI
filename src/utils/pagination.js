// src/utils/pagination.js

const paginateResults = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const totalItems = total;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
  };
};

module.exports = paginateResults;
