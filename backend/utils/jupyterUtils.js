/**
 * Jupyter Notebook utilities for selective content extraction
 */

/**
 * Parse Jupyter notebook and extract specific cells
 * @param {string} notebookContent - Raw .ipynb file content
 * @param {Array<number>} cellIndices - Array of cell indices to extract (0-based)
 * @returns {Object} - Extracted content and metadata
 */
function extractJupyterCells(notebookContent, cellIndices = []) {
  try {
    const notebook = JSON.parse(notebookContent);
    
    if (!notebook.cells || !Array.isArray(notebook.cells)) {
      throw new Error('Invalid Jupyter notebook format');
    }
    
    // If no specific cells requested, use intelligent selection
    if (cellIndices.length === 0) {
      cellIndices = selectOptimalCells(notebook.cells);
    }
    
    const extractedCells = [];
    const metadata = {
      totalCells: notebook.cells.length,
      extractedCells: cellIndices.length,
      cellTypes: {},
      hasCodeCells: false,
      hasMarkdownCells: false
    };
    
    cellIndices.forEach(index => {
      if (index >= 0 && index < notebook.cells.length) {
        const cell = notebook.cells[index];
        extractedCells.push({
          index,
          type: cell.cell_type,
          content: extractCellContent(cell),
          source: cell.source
        });
        
        // Update metadata
        metadata.cellTypes[cell.cell_type] = (metadata.cellTypes[cell.cell_type] || 0) + 1;
        if (cell.cell_type === 'code') metadata.hasCodeCells = true;
        if (cell.cell_type === 'markdown') metadata.hasMarkdownCells = true;
      }
    });
    
    const extractedContent = extractedCells.map(cell => {
      return `### Cell ${cell.index + 1} (${cell.type})\n${cell.content}\n`;
    }).join('\n');
    
    return {
      content: extractedContent,
      metadata,
      cells: extractedCells,
      originalCellCount: notebook.cells.length
    };
    
  } catch (error) {
    console.error('Error parsing Jupyter notebook:', error);
    // Fallback to original content truncation
    return {
      content: notebookContent.substring(0, 6000) + '\n\n[Content truncated - could not parse notebook]',
      metadata: { error: error.message },
      cells: [],
      originalCellCount: 0
    };
  }
}

/**
 * Extract content from a single Jupyter cell
 */
function extractCellContent(cell) {
  if (!cell.source) return '';
  
  // Handle both string and array formats
  let content = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
  
  // For code cells, include outputs if available
  if (cell.cell_type === 'code' && cell.outputs && cell.outputs.length > 0) {
    const outputs = cell.outputs.map(output => {
      if (output.text) {
        return Array.isArray(output.text) ? output.text.join('') : output.text;
      }
      if (output.data && output.data['text/plain']) {
        const data = output.data['text/plain'];
        return Array.isArray(data) ? data.join('') : data;
      }
      return '';
    }).filter(Boolean);
    
    if (outputs.length > 0) {
      content += '\n\n# Output:\n' + outputs.join('\n');
    }
  }
  
  return content;
}

/**
 * Intelligently select optimal cells from a notebook
 */
function selectOptimalCells(cells, maxCells = 5) {
  const codeCells = [];
  const markdownCells = [];
  
  cells.forEach((cell, index) => {
    if (cell.cell_type === 'code' && cell.source && cell.source.length > 0) {
      // Skip empty or very short code cells
      const content = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
      if (content.trim().length > 20) {
        codeCells.push({ index, content, length: content.length });
      }
    } else if (cell.cell_type === 'markdown' && cell.source && cell.source.length > 0) {
      const content = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
      if (content.trim().length > 50) {
        markdownCells.push({ index, content, length: content.length });
      }
    }
  });
  
  // Prioritize cells with substantial content
  const selectedIndices = [];
  
  // Select up to 3 substantial code cells
  codeCells
    .sort((a, b) => b.length - a.length) // Sort by content length
    .slice(0, 3)
    .forEach(cell => selectedIndices.push(cell.index));
  
  // Add 1-2 markdown cells for context
  markdownCells
    .sort((a, b) => b.length - a.length)
    .slice(0, Math.min(2, maxCells - selectedIndices.length))
    .forEach(cell => selectedIndices.push(cell.index));
  
  // Sort indices to maintain original order
  return selectedIndices.sort((a, b) => a - b).slice(0, maxCells);
}

/**
 * Get notebook summary for user selection
 */
function getNotebookSummary(notebookContent) {
  try {
    const notebook = JSON.parse(notebookContent);
    
    if (!notebook.cells || !Array.isArray(notebook.cells)) {
      return { error: 'Invalid Jupyter notebook format' };
    }
    
    const summary = notebook.cells.map((cell, index) => {
      const content = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '');
      const preview = content.substring(0, 100).replace(/\n/g, ' ') + (content.length > 100 ? '...' : '');
      
      return {
        index,
        type: cell.cell_type,
        preview,
        length: content.length,
        hasOutput: cell.cell_type === 'code' && cell.outputs && cell.outputs.length > 0
      };
    });
    
    return {
      cells: summary,
      totalCells: summary.length,
      codeCells: summary.filter(c => c.type === 'code').length,
      markdownCells: summary.filter(c => c.type === 'markdown').length
    };
    
  } catch (error) {
    return { error: 'Could not parse notebook: ' + error.message };
  }
}

module.exports = {
  extractJupyterCells,
  getNotebookSummary,
  selectOptimalCells
};
