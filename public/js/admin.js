const deleteProduct=(btn)=>{
    //storing the specific product values 
    const ProdID= btn.parentNode.querySelector('[name=productId]').value;
    const csrf=btn.parentNode.querySelector('[name=_csrf').value;
    const product=btn.closest('article')


    fetch('/admin/product/' + ProdID,{
        method:'DELETE',
        headers:{
            'csrf-token':csrf
        }
    })
    .then(result=>{
        return result.json()
        .then(data=>{
            console.log(data);
            product.parentNode.removeChild(product);
        }
        )
    })
    .catch(err=>{
        console.log(err);
    })
};