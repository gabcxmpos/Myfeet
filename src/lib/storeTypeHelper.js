/**
 * Helper functions para identificar e filtrar lojas por tipo (própria vs franquia)
 */

/**
 * Retorna o tipo de loja baseado no role do usuário
 * @param {string} role - Role do usuário
 * @returns {string|null} - 'propria', 'franquia' ou null (admin vê tudo)
 */
export const getStoreTypeFromRole = (role) => {
  if (!role) return null;
  
  switch (role) {
    case 'loja':
    case 'supervisor':
    case 'admin_loja':
    case 'colaborador':
      return 'propria';
    case 'loja_franquia':
    case 'supervisor_franquia':
      return 'franquia';
    case 'admin':
      return null; // Admin vê tudo (próprias e franquias)
    default:
      return null; // Outros roles também veem tudo por padrão
  }
};

/**
 * Verifica se um role é de loja (própria ou franquia)
 * @param {string} role - Role do usuário
 * @returns {boolean}
 */
export const isStoreRole = (role) => {
  return role === 'loja' || role === 'loja_franquia' || role === 'admin_loja' || role === 'colaborador';
};

/**
 * Verifica se um role é de supervisor (própria ou franquia)
 * @param {string} role - Role do usuário
 * @returns {boolean}
 */
export const isSupervisorRole = (role) => {
  return role === 'supervisor' || role === 'supervisor_franquia';
};

/**
 * Filtra lojas baseado no tipo do usuário
 * @param {Array} stores - Array de lojas
 * @param {string} userRole - Role do usuário
 * @param {string|null} userStoreId - ID da loja do usuário (se for loja)
 * @returns {Array} - Lojas filtradas
 */
export const filterStoresByUserType = (stores, userRole, userStoreId = null) => {
  if (!stores || stores.length === 0) return [];
  
  // Admin vê tudo (próprias e franquias)
  if (userRole === 'admin') {
    return stores;
  }
  
  const storeType = getStoreTypeFromRole(userRole);
  
  // Se não tem tipo definido (admin ou outros roles especiais), retornar todas
  if (!storeType) {
    return stores;
  }
  
  // Filtrar por tipo (propria ou franquia)
  let filtered = stores.filter(store => {
    // Se a loja não tem tipo definido, considerar como 'propria' por padrão
    const storeTipo = store.tipo || 'propria';
    return storeTipo === storeType;
  });
  
  // Se for loja (não supervisor), mostrar apenas sua loja
  if (isStoreRole(userRole) && userStoreId) {
    filtered = filtered.filter(store => store.id === userStoreId);
  }
  
  return filtered;
};

/**
 * Verifica se um usuário pode ver uma loja específica
 * @param {Object} store - Objeto da loja
 * @param {string} userRole - Role do usuário
 * @param {string|null} userStoreId - ID da loja do usuário (se for loja)
 * @returns {boolean}
 */
export const canUserViewStore = (store, userRole, userStoreId = null) => {
  if (!store) return false;
  
  // Admin vê tudo
  if (userRole === 'admin') {
    return true;
  }
  
  const storeType = getStoreTypeFromRole(userRole);
  
  // Se não tem tipo definido, permitir (admin ou outros roles especiais)
  if (!storeType) {
    return true;
  }
  
  // Se a loja não tem tipo definido, considerar como 'propria' por padrão
  const storeTipo = store.tipo || 'propria';
  
  // Verificar se o tipo da loja corresponde ao tipo do usuário
  if (storeTipo !== storeType) {
    return false;
  }
  
  // Se for loja, só pode ver sua própria loja
  if (isStoreRole(userRole) && userStoreId) {
    return store.id === userStoreId;
  }
  
  return true;
};

/**
 * Agrupa roles relacionados (própria e franquia)
 * @param {string} role - Role do usuário
 * @returns {Array} - Array com roles relacionados
 */
export const getRelatedRoles = (role) => {
  switch (role) {
    case 'loja':
      return ['loja'];
    case 'loja_franquia':
      return ['loja_franquia'];
    case 'supervisor':
      return ['supervisor'];
    case 'supervisor_franquia':
      return ['supervisor_franquia'];
    default:
      return [role];
  }
};

/**
 * Verifica se dois roles são do mesmo tipo (própria ou franquia)
 * @param {string} role1 - Primeiro role
 * @param {string} role2 - Segundo role
 * @returns {boolean}
 */
export const areRolesSameType = (role1, role2) => {
  const type1 = getStoreTypeFromRole(role1);
  const type2 = getStoreTypeFromRole(role2);
  
  if (!type1 || !type2) return false;
  
  return type1 === type2;
};

