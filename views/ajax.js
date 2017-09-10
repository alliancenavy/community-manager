<script>
    $(document).ready(function(){
        $("input:checkbox").change(function() {
            $.ajax({
                type: "POST",
                url: "/callback_ajax",
                data: JSON.stringify({
                    strID: $(this).attr("data-id"),
                    strState: $(this).is(":checked"),
                }),
                contentType: "application/json"
            });
        });
    });
</script>