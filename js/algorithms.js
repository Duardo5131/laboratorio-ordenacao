// ============================================================
// algorithms.js — dados didáticos + geradores de passos (steps)
// Cada gerador produz eventos: {event:{type, i, j, value, message, line}, array}
// type ∈ 'info' | 'compare' | 'swap' | 'overwrite' | 'sorted' | 'done'
// ============================================================

const ALGO_ORDER = ['bubble','selection','insertion','merge','quick','heap','shell'];

const ALGO_META = {

  bubble: {
    id:'bubble', name:'Bubble Sort', tagline:'clássico · trocas', mini:[35,60,45,85,30],
    short:'Compara pares vizinhos e vai "borbulhando" os maiores até o fim da lista.',
    explanation:`
      <p>O Bubble Sort funciona comparando <strong>dois elementos vizinhos</strong> por vez. Se o da esquerda for maior que o da direita, eles trocam de lugar.</p>
      <p>Esse processo se repete várias vezes, percorrendo a lista inteira a cada rodada. A cada passagem completa, o maior elemento "borbulha" até sua posição final — por isso o nome.</p>
      <p>É o algoritmo mais simples de entender, mas também um dos menos eficientes para listas grandes.</p>`,
    code:[
      'def bubble_sort(lista):',
      '    n = len(lista)',
      '    for i in range(n - 1):',
      '        for j in range(n - 1 - i):',
      '            if lista[j] > lista[j + 1]:',
      '                lista[j], lista[j + 1] = lista[j + 1], lista[j]',
      '    return lista'
    ],
    lineExplain:{
      0:'Define a função que recebe a lista a ser ordenada.',
      1:'Guarda o tamanho da lista em "n".',
      2:'Repete o processo "n-1" vezes — cada rodada completa.',
      3:'Percorre a lista comparando vizinhos, evitando reconferir o que já está ordenado no fim.',
      4:'Compara os dois elementos vizinhos para verificar se precisam trocar de posição.',
      5:'Realiza a troca: o maior avança e o menor recua uma posição.',
      6:'Devolve a lista já ordenada.'
    },
    complexity:{best:'O(n)', avg:'O(n²)', worst:'O(n²)', space:'O(1)'},
    pros:['Muito simples de entender e implementar','Não usa memória extra','Detecta rapidamente se a lista já está ordenada'],
    cons:['Muito lento para listas grandes','Faz muitas trocas desnecessárias','Poucas aplicações práticas reais'],
    when:'Bom apenas para fins didáticos ou listas muito pequenas, onde a simplicidade importa mais que a velocidade.',
    generator: function*(arr){
      let a = arr.slice(), n = a.length;
      yield {event:{type:'info', message:'Lista inicial.', line:1}, array:a.slice()};
      for(let i=0;i<n-1;i++){
        let swapped=false;
        for(let j=0;j<n-1-i;j++){
          yield {event:{type:'compare', i:j, j:j+1, message:`Comparando posições ${j} e ${j+1}.`, line:4}, array:a.slice()};
          if(a[j]>a[j+1]){
            [a[j],a[j+1]]=[a[j+1],a[j]];
            swapped=true;
            yield {event:{type:'swap', i:j, j:j+1, message:`Como ${a[j+1]} é maior que ${a[j]}, foi realizada uma troca.`, line:5}, array:a.slice()};
          }
        }
        yield {event:{type:'sorted', indices:[n-1-i], message:`Posição ${n-1-i} está ordenada.`, line:2}, array:a.slice()};
        if(!swapped) break;
      }
      yield {event:{type:'done', message:'Ordenação concluída!', line:6}, array:a.slice(), sortedAll:true};
    }
  },

  selection: {
    id:'selection', name:'Selection Sort', tagline:'busca do menor', mini:[70,40,55,25,90],
    short:'Encontra o menor elemento restante e o coloca no início a cada rodada.',
    explanation:`
      <p>O Selection Sort divide a lista em duas partes: a parte já ordenada (à esquerda) e a parte ainda desordenada (à direita).</p>
      <p>A cada rodada, ele <strong>percorre toda a parte desordenada</strong> procurando o menor valor, e o troca de lugar com o primeiro elemento dessa parte.</p>
      <p>Diferente do Bubble Sort, ele faz no máximo uma troca por rodada — mas ainda precisa comparar todos os pares.</p>`,
    code:[
      'def selection_sort(lista):',
      '    n = len(lista)',
      '    for i in range(n - 1):',
      '        menor = i',
      '        for j in range(i + 1, n):',
      '            if lista[j] < lista[menor]:',
      '                menor = j',
      '        lista[i], lista[menor] = lista[menor], lista[i]',
      '    return lista'
    ],
    lineExplain:{
      0:'Define a função que recebe a lista a ser ordenada.',
      1:'Guarda o tamanho da lista em "n".',
      2:'Uma rodada para cada posição, exceto a última (que sobra sozinha).',
      3:'Assume, por enquanto, que o menor valor está na posição atual "i".',
      4:'Percorre o restante da lista, à procura de um valor ainda menor.',
      5:'Compara o elemento atual com o menor já encontrado.',
      6:'Atualiza a posição do menor valor encontrado até agora.',
      7:'Troca o menor valor encontrado com a posição "i", fechando a rodada.',
      8:'Devolve a lista já ordenada.'
    },
    complexity:{best:'O(n²)', avg:'O(n²)', worst:'O(n²)', space:'O(1)'},
    pros:['Simples de entender','Faz poucas trocas (no máximo n-1)','Bom quando trocar elementos é uma operação cara'],
    cons:['Sempre O(n²), mesmo com lista quase ordenada','Não é estável por padrão','Lento para listas grandes'],
    when:'Interessante quando o custo de mover elementos é muito maior que o custo de compará-los.',
    generator: function*(arr){
      let a = arr.slice(), n = a.length;
      yield {event:{type:'info', message:'Lista inicial.', line:1}, array:a.slice()};
      for(let i=0;i<n-1;i++){
        let menor = i;
        for(let j=i+1;j<n;j++){
          yield {event:{type:'compare', i:j, j:menor, message:`Comparando posição ${j} com o menor atual (posição ${menor}).`, line:5}, array:a.slice()};
          if(a[j]<a[menor]){
            menor = j;
            yield {event:{type:'compare', i:j, j:menor, message:`Novo menor encontrado na posição ${j}.`, line:6}, array:a.slice()};
          }
        }
        if(menor!==i){
          [a[i],a[menor]]=[a[menor],a[i]];
          yield {event:{type:'swap', i, j:menor, message:`Troca entre as posições ${i} e ${menor}.`, line:7}, array:a.slice()};
        }
        yield {event:{type:'sorted', indices:[i], message:`Posição ${i} está ordenada.`, line:7}, array:a.slice()};
      }
      yield {event:{type:'sorted', indices:[n-1], message:'', line:8}, array:a.slice()};
      yield {event:{type:'done', message:'Ordenação concluída!', line:8}, array:a.slice(), sortedAll:true};
    }
  },

  insertion: {
    id:'insertion', name:'Insertion Sort', tagline:'insere na posição certa', mini:[50,80,35,60,45],
    short:'Pega cada elemento e o insere na posição correta entre os já ordenados.',
    explanation:`
      <p>Pense em como você organiza cartas de baralho na mão: você pega uma carta nova e a encaixa no lugar certo entre as que já estão ordenadas.</p>
      <p>O Insertion Sort faz exatamente isso: para cada novo elemento, ele <strong>desloca os elementos maiores para a direita</strong> até encontrar o lugar correto para inseri-lo.</p>
      <p>É muito eficiente quando a lista já está quase ordenada.</p>`,
    code:[
      'def insertion_sort(lista):',
      '    for i in range(1, len(lista)):',
      '        atual = lista[i]',
      '        j = i - 1',
      '        while j >= 0 and lista[j] > atual:',
      '            lista[j + 1] = lista[j]',
      '            j -= 1',
      '        lista[j + 1] = atual',
      '    return lista'
    ],
    lineExplain:{
      0:'Define a função que recebe a lista a ser ordenada.',
      1:'Começa do segundo elemento (índice 1), já que um único elemento já está "ordenado".',
      2:'Guarda o valor que será inserido na posição correta.',
      3:'Aponta para o elemento imediatamente à esquerda do atual.',
      4:'Enquanto houver elementos maiores à esquerda, continue deslocando.',
      5:'Empurra o elemento maior uma posição para a direita, abrindo espaço.',
      6:'Move o ponteiro uma posição para a esquerda.',
      7:'Insere o valor guardado na posição correta, já aberta.',
      8:'Devolve a lista já ordenada.'
    },
    complexity:{best:'O(n)', avg:'O(n²)', worst:'O(n²)', space:'O(1)'},
    pros:['Muito rápido para listas pequenas ou quase ordenadas','Simples e estável','Ordena "conforme os dados chegam" (online)'],
    cons:['Lento para listas grandes e muito desordenadas','Requer muitos deslocamentos no pior caso'],
    when:'Ótimo para listas pequenas, quase ordenadas, ou quando os dados chegam aos poucos.',
    generator: function*(arr){
      let a = arr.slice(), n = a.length;
      yield {event:{type:'info', message:'Lista inicial.', line:1}, array:a.slice()};
      yield {event:{type:'sorted', indices:[0], message:'O primeiro elemento já está "ordenado" sozinho.', line:1}, array:a.slice()};
      for(let i=1;i<n;i++){
        let atual = a[i], j = i-1;
        yield {event:{type:'compare', i, j:i, message:`Elemento a inserir: ${atual} (posição ${i}).`, line:2}, array:a.slice()};
        while(j>=0){
          yield {event:{type:'compare', i:j, j:j+1, message:`Comparando ${a[j]} com ${atual}.`, line:4}, array:a.slice()};
          if(a[j]>atual){
            a[j+1]=a[j];
            yield {event:{type:'overwrite', i:j+1, value:a[j], message:`${a[j]} desloca uma posição para a direita.`, line:5}, array:a.slice()};
            j--;
          } else break;
        }
        a[j+1]=atual;
        yield {event:{type:'overwrite', i:j+1, value:atual, message:`${atual} inserido na posição ${j+1}.`, line:7}, array:a.slice()};
        yield {event:{type:'sorted', indices:Array.from({length:i+1},(_,k)=>k), message:`Os elementos até a posição ${i} já estão ordenados entre si.`, line:7}, array:a.slice()};
      }
      yield {event:{type:'done', message:'Ordenação concluída!', line:8}, array:a.slice(), sortedAll:true};
    }
  },

  merge: {
    id:'merge', name:'Merge Sort', tagline:'dividir para conquistar', mini:[45,65,45,65,80],
    short:'Divide a lista em metades, ordena cada uma e depois junta tudo.',
    explanation:`
      <p>O Merge Sort segue a estratégia de <strong>dividir para conquistar</strong>: divide a lista ao meio repetidamente, até sobrar sublistas de um único elemento (que já estão "ordenadas").</p>
      <p>Depois, ele vai <strong>juntando (merge)</strong> essas sublistas duas a duas, sempre comparando os menores elementos de cada uma, formando sublistas cada vez maiores e ordenadas — até reconstruir a lista inteira, ordenada.</p>`,
    code:[
      'def merge_sort(lista):',
      '    if len(lista) <= 1:',
      '        return lista',
      '    meio = len(lista) // 2',
      '    esquerda = merge_sort(lista[:meio])',
      '    direita = merge_sort(lista[meio:])',
      '    return merge(esquerda, direita)',
      '',
      'def merge(esquerda, direita):',
      '    resultado, i, j = [], 0, 0',
      '    while i < len(esquerda) and j < len(direita):',
      '        if esquerda[i] <= direita[j]:',
      '            resultado.append(esquerda[i]); i += 1',
      '        else:',
      '            resultado.append(direita[j]); j += 1',
      '    resultado.extend(esquerda[i:])',
      '    resultado.extend(direita[j:])',
      '    return resultado'
    ],
    lineExplain:{
      0:'Define a função recursiva de ordenação.',
      1:'Caso base: uma lista com 0 ou 1 elemento já está ordenada.',
      2:'Devolve a própria lista, sem alterações.',
      3:'Calcula o meio da lista para dividi-la em duas partes.',
      4:'Ordena recursivamente a metade esquerda.',
      5:'Ordena recursivamente a metade direita.',
      6:'Junta (merge) as duas metades já ordenadas em uma única lista.',
      8:'Define a função que junta duas listas ordenadas em uma só.',
      9:'Cria a lista de resultado e os contadores de cada lado.',
      10:'Enquanto houver elementos dos dois lados, continue comparando.',
      11:'Compara o elemento da esquerda com o da direita.',
      12:'O menor elemento é o da esquerda: ele entra no resultado.',
      13:'Caso contrário...',
      14:'...o menor é o da direita: ele entra no resultado.',
      15:'Copia o que sobrou da esquerda, se houver.',
      16:'Copia o que sobrou da direita, se houver.',
      17:'Devolve a lista final, já ordenada.'
    },
    complexity:{best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)', space:'O(n)'},
    pros:['Desempenho previsível e consistente','Ótimo para listas muito grandes','É estável (mantém a ordem de elementos iguais)'],
    cons:['Usa memória extra para as sublistas','Mais complexo de implementar que os algoritmos O(n²)'],
    when:'Ideal para grandes volumes de dados onde desempenho previsível é essencial, como em ordenação externa (arquivos).',
    generator: function*(arr){
      let a = arr.slice();
      function* mergeStep(lo, mid, hi){
        let left = a.slice(lo, mid+1), right = a.slice(mid+1, hi+1);
        let i=0, j=0, k=lo;
        while(i<left.length && j<right.length){
          yield {event:{type:'compare', i:lo+i, j:mid+1+j, message:`Comparando ${left[i]} (esquerda) com ${right[j]} (direita).`, line:11}, array:a.slice()};
          if(left[i]<=right[j]){
            a[k]=left[i];
            yield {event:{type:'overwrite', i:k, value:left[i], message:`${left[i]} é o menor: entra na posição ${k}.`, line:12}, array:a.slice()};
            i++; k++;
          } else {
            a[k]=right[j];
            yield {event:{type:'overwrite', i:k, value:right[j], message:`${right[j]} é o menor: entra na posição ${k}.`, line:14}, array:a.slice()};
            j++; k++;
          }
        }
        while(i<left.length){ a[k]=left[i]; yield {event:{type:'overwrite', i:k, value:left[i], message:'Copiando o restante da esquerda.', line:15}, array:a.slice()}; i++; k++; }
        while(j<right.length){ a[k]=right[j]; yield {event:{type:'overwrite', i:k, value:right[j], message:'Copiando o restante da direita.', line:16}, array:a.slice()}; j++; k++; }
      }
      function* sort(lo, hi){
        if(lo>=hi) return;
        let mid = Math.floor((lo+hi)/2);
        yield* sort(lo, mid);
        yield* sort(mid+1, hi);
        yield* mergeStep(lo, mid, hi);
      }
      yield {event:{type:'info', message:'Início do Merge Sort: dividir para conquistar.', line:0}, array:a.slice()};
      yield* sort(0, a.length-1);
      yield {event:{type:'done', message:'Ordenação concluída!', line:17}, array:a.slice(), sortedAll:true};
    }
  },

  quick: {
    id:'quick', name:'Quick Sort', tagline:'pivô e partição', mini:[85,30,60,40,70],
    short:'Escolhe um pivô e organiza os menores à esquerda e maiores à direita.',
    explanation:`
      <p>O Quick Sort escolhe um elemento chamado <strong>pivô</strong> (aqui, sempre o último da faixa). Depois, ele reorganiza a lista de forma que todos os elementos <strong>menores</strong> que o pivô fiquem à esquerda, e os <strong>maiores</strong>, à direita — esse processo é chamado de <em>partição</em>.</p>
      <p>Depois disso, o pivô já está em sua posição final. O mesmo processo é repetido, recursivamente, para as partes à esquerda e à direita do pivô.</p>`,
    code:[
      'def quick_sort(lista, inicio=0, fim=None):',
      '    if fim is None:',
      '        fim = len(lista) - 1',
      '    if inicio < fim:',
      '        p = particiona(lista, inicio, fim)',
      '        quick_sort(lista, inicio, p - 1)',
      '        quick_sort(lista, p + 1, fim)',
      '    return lista',
      '',
      'def particiona(lista, inicio, fim):',
      '    pivo = lista[fim]',
      '    i = inicio - 1',
      '    for j in range(inicio, fim):',
      '        if lista[j] <= pivo:',
      '            i += 1',
      '            lista[i], lista[j] = lista[j], lista[i]',
      '    lista[i + 1], lista[fim] = lista[fim], lista[i + 1]',
      '    return i + 1'
    ],
    lineExplain:{
      0:'Define a função recursiva, controlando o início e fim da faixa atual.',
      1:'Na primeira chamada, "fim" ainda não foi definido.',
      2:'Define o fim como o último índice da lista.',
      3:'Só há o que ordenar se existir mais de um elemento na faixa.',
      4:'Particiona a lista, obtendo a posição final do pivô.',
      5:'Ordena recursivamente tudo que ficou à esquerda do pivô.',
      6:'Ordena recursivamente tudo que ficou à direita do pivô.',
      7:'Devolve a lista já ordenada.',
      9:'Define a função responsável por posicionar o pivô corretamente.',
      10:'O pivô escolhido é sempre o último elemento da faixa.',
      11:'Marca a fronteira entre os menores que o pivô e o restante.',
      12:'Percorre a faixa, exceto o próprio pivô.',
      13:'Compara os dois elementos vizinhos para verificar se precisam trocar de posição.',
      14:'Avança a fronteira dos elementos menores que o pivô.',
      15:'Move o elemento menor para dentro da fronteira.',
      16:'Coloca o pivô exatamente entre os menores e os maiores.',
      17:'Devolve a posição final do pivô.'
    },
    complexity:{best:'O(n log n)', avg:'O(n log n)', worst:'O(n²)', space:'O(log n)'},
    pros:['Muito rápido na prática, mesmo com overhead baixo','Ordena "no lugar" (pouca memória extra)','Base de muitas bibliotecas de ordenação'],
    cons:['Pior caso O(n²) com escolhas ruins de pivô','Não é estável por padrão','Desempenho depende da escolha do pivô'],
    when:'Ótima escolha geral, especialmente quando a memória é limitada e o desempenho médio importa mais que o pior caso.',
    generator: function*(arr){
      let a = arr.slice();
      function* qs(lo, hi){
        if(lo>hi) return;
        if(lo===hi){ yield {event:{type:'sorted', indices:[lo], message:'', line:7}, array:a.slice()}; return; }
        let pivot = a[hi];
        yield {event:{type:'info', message:`Pivô escolhido: ${pivot} (posição ${hi}).`, line:10}, array:a.slice()};
        let i = lo-1;
        for(let j=lo;j<hi;j++){
          yield {event:{type:'compare', i:j, j:hi, message:`Comparando ${a[j]} com o pivô ${pivot}.`, line:13}, array:a.slice()};
          if(a[j]<=pivot){
            i++;
            if(i!==j){
              [a[i],a[j]]=[a[j],a[i]];
              yield {event:{type:'swap', i, j, message:`Troca entre as posições ${i} e ${j}.`, line:15}, array:a.slice()};
            }
          }
        }
        [a[i+1],a[hi]]=[a[hi],a[i+1]];
        yield {event:{type:'swap', i:i+1, j:hi, message:`Pivô movido para sua posição final: ${i+1}.`, line:16}, array:a.slice()};
        yield {event:{type:'sorted', indices:[i+1], message:`Posição ${i+1} está ordenada (era o pivô).`, line:17}, array:a.slice()};
        yield* qs(lo, i);
        yield* qs(i+2, hi);
      }
      yield {event:{type:'info', message:'Início do Quick Sort.', line:0}, array:a.slice()};
      yield* qs(0, a.length-1);
      yield {event:{type:'done', message:'Ordenação concluída!', line:7}, array:a.slice(), sortedAll:true};
    }
  },

  heap: {
    id:'heap', name:'Heap Sort', tagline:'árvore de prioridades', mini:[60,90,40,55,30],
    short:'Organiza a lista como uma árvore binária e extrai sempre o maior valor.',
    explanation:`
      <p>O Heap Sort enxerga a lista como uma <strong>árvore binária</strong> guardada dentro de um array. Primeiro, ele transforma essa árvore em um "heap máximo", onde o maior valor sempre fica na raiz (posição 0).</p>
      <p>Depois, ele troca a raiz (o maior valor) com o último elemento da lista, "reduz" o heap em um, e reorganiza (heapify) o que sobrou para que o novo maior volte à raiz. Isso se repete até a lista toda estar ordenada.</p>`,
    code:[
      'def heap_sort(lista):',
      '    n = len(lista)',
      '    for i in range(n // 2 - 1, -1, -1):',
      '        heapify(lista, n, i)',
      '    for i in range(n - 1, 0, -1):',
      '        lista[0], lista[i] = lista[i], lista[0]',
      '        heapify(lista, i, 0)',
      '    return lista',
      '',
      'def heapify(lista, n, i):',
      '    maior, esq, dir = i, 2 * i + 1, 2 * i + 2',
      '    if esq < n and lista[esq] > lista[maior]:',
      '        maior = esq',
      '    if dir < n and lista[dir] > lista[maior]:',
      '        maior = dir',
      '    if maior != i:',
      '        lista[i], lista[maior] = lista[maior], lista[i]',
      '        heapify(lista, n, maior)'
    ],
    lineExplain:{
      0:'Define a função principal de ordenação.',
      1:'Guarda o tamanho da lista.',
      2:'Percorre de trás para frente, a partir do último "pai" da árvore.',
      3:'Garante que cada sub-árvore respeite a propriedade de heap máximo.',
      4:'Percorre do final para o início, retirando o maior elemento a cada vez.',
      5:'Move o maior valor (raiz) para o final da parte ainda não ordenada.',
      6:'Reorganiza o heap reduzido, trazendo o novo maior para a raiz.',
      7:'Devolve a lista já ordenada.',
      9:'Define a função que corrige a propriedade de heap a partir da posição "i".',
      10:'Calcula as posições do filho esquerdo e do filho direito.',
      11:'Compara o filho esquerdo com o maior valor conhecido até agora.',
      12:'Atualiza a posição do maior valor, se o filho esquerdo for maior.',
      13:'Compara o filho direito com o maior valor conhecido até agora.',
      14:'Atualiza a posição do maior valor, se o filho direito for maior.',
      15:'Se o maior valor não for a raiz atual, é preciso corrigir.',
      16:'Troca a raiz com o filho de maior valor.',
      17:'Repete o processo a partir da nova posição afetada.'
    },
    complexity:{best:'O(n log n)', avg:'O(n log n)', worst:'O(n log n)', space:'O(1)'},
    pros:['Desempenho garantido de O(n log n) em qualquer caso','Ordena "no lugar", sem memória extra significativa','Bom quando o pior caso importa muito'],
    cons:['Mais difícil de visualizar e implementar','Na prática costuma ser um pouco mais lento que o Quick Sort','Não é estável'],
    when:'Indicado quando é preciso garantir bom desempenho no pior caso, com pouquíssima memória extra disponível.',
    generator: function*(arr){
      let a = arr.slice(), n = a.length;
      function* heapify(size, i){
        let maior=i, esq=2*i+1, dir=2*i+2;
        if(esq<size){
          yield {event:{type:'compare', i:esq, j:maior, message:`Comparando filho esquerdo (${a[esq]}) com o maior atual (${a[maior]}).`, line:11}, array:a.slice()};
          if(a[esq]>a[maior]) maior=esq;
        }
        if(dir<size){
          yield {event:{type:'compare', i:dir, j:maior, message:`Comparando filho direito (${a[dir]}) com o maior atual (${a[maior]}).`, line:13}, array:a.slice()};
          if(a[dir]>a[maior]) maior=dir;
        }
        if(maior!==i){
          [a[i],a[maior]]=[a[maior],a[i]];
          yield {event:{type:'swap', i, j:maior, message:`Troca entre as posições ${i} e ${maior} para manter o heap.`, line:16}, array:a.slice()};
          yield* heapify(size, maior);
        }
      }
      yield {event:{type:'info', message:'Construindo o heap máximo.', line:1}, array:a.slice()};
      for(let i=Math.floor(n/2)-1;i>=0;i--) yield* heapify(n,i);
      for(let i=n-1;i>0;i--){
        [a[0],a[i]]=[a[i],a[0]];
        yield {event:{type:'swap', i:0, j:i, message:`Maior elemento movido para a posição final ${i}.`, line:5}, array:a.slice()};
        yield {event:{type:'sorted', indices:[i], message:`Posição ${i} está ordenada.`, line:5}, array:a.slice()};
        yield* heapify(i, 0);
      }
      yield {event:{type:'sorted', indices:[0], message:'', line:7}, array:a.slice()};
      yield {event:{type:'done', message:'Ordenação concluída!', line:7}, array:a.slice(), sortedAll:true};
    }
  },

  shell: {
    id:'shell', name:'Shell Sort', tagline:'insertion com saltos', mini:[55,35,75,50,65],
    short:'Um Insertion Sort que compara elementos distantes antes de refinar os saltos.',
    explanation:`
      <p>O Shell Sort é uma evolução do Insertion Sort. Em vez de comparar apenas vizinhos, ele compara elementos separados por um <strong>intervalo (gap)</strong>, que começa grande e vai diminuindo.</p>
      <p>Isso permite que elementos muito fora do lugar "saltem" várias posições de uma vez, em vez de andar uma posição por vez — tornando o processo bem mais rápido que o Insertion Sort tradicional.</p>`,
    code:[
      'def shell_sort(lista):',
      '    n = len(lista)',
      '    intervalo = n // 2',
      '    while intervalo > 0:',
      '        for i in range(intervalo, n):',
      '            temp = lista[i]',
      '            j = i',
      '            while j >= intervalo and lista[j - intervalo] > temp:',
      '                lista[j] = lista[j - intervalo]',
      '                j -= intervalo',
      '            lista[j] = temp',
      '        intervalo //= 2',
      '    return lista'
    ],
    lineExplain:{
      0:'Define a função que recebe a lista a ser ordenada.',
      1:'Guarda o tamanho da lista.',
      2:'O intervalo inicial é a metade do tamanho da lista.',
      3:'Continua o processo enquanto o intervalo for maior que zero.',
      4:'Percorre a lista a partir da posição igual ao intervalo atual.',
      5:'Guarda o valor que será reposicionado.',
      6:'Aponta para a posição atual.',
      7:'Enquanto houver, "intervalo" posições atrás, um valor maior...',
      8:'...esse valor salta para a posição atual.',
      9:'O ponteiro recua um intervalo inteiro de uma vez.',
      10:'Insere o valor guardado na posição correta encontrada.',
      11:'Reduz o intervalo pela metade, refinando as comparações.',
      12:'Devolve a lista já ordenada.'
    },
    complexity:{best:'O(n log n)', avg:'O(n^1.3) aprox.', worst:'O(n²)', space:'O(1)'},
    pros:['Mais rápido que Insertion e Bubble Sort na prática','Não usa memória extra','Fácil de adaptar a partir do Insertion Sort'],
    cons:['Desempenho depende muito da sequência de intervalos escolhida','Mais difícil de analisar teoricamente','Não é estável'],
    when:'Boa opção intermediária quando o Insertion Sort é simples demais, mas o Merge/Quick Sort seriam complexos demais para o caso.',
    generator: function*(arr){
      let a = arr.slice(), n = a.length;
      let gap = Math.floor(n/2);
      yield {event:{type:'info', message:`Intervalo inicial: ${gap}.`, line:2}, array:a.slice()};
      while(gap>0){
        for(let i=gap;i<n;i++){
          let temp=a[i], j=i;
          while(j>=gap){
            yield {event:{type:'compare', i:j-gap, j:j, message:`Comparando posições ${j-gap} e ${j} (intervalo ${gap}).`, line:7}, array:a.slice()};
            if(a[j-gap]>temp){
              a[j]=a[j-gap];
              yield {event:{type:'overwrite', i:j, value:a[j], message:`Valor salta para a posição ${j}.`, line:8}, array:a.slice()};
              j-=gap;
            } else break;
          }
          a[j]=temp;
          yield {event:{type:'overwrite', i:j, value:temp, message:`${temp} posicionado em ${j}.`, line:10}, array:a.slice()};
        }
        gap = Math.floor(gap/2);
        if(gap>0) yield {event:{type:'info', message:`Novo intervalo: ${gap}.`, line:11}, array:a.slice()};
      }
      yield {event:{type:'done', message:'Ordenação concluída!', line:12}, array:a.slice(), sortedAll:true};
    }
  }
};
